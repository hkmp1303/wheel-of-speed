using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using WheelOfSpeed.Hubs;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;

namespace WheelOfSpeed.Services;

public interface IMatchService
{
    Task<MatchStateDto> CreateMatchAsync(string hostName, Difficulty difficulty = Difficulty.Normal);
    Task<MatchStateDto> JoinMatchAsync(string guidCode, string playerName);
    Task<MatchStateDto> MarkReadyAsync(string guidCode, string playerId);
    Task<MatchStateDto> GetMatchAsync(string guidCode);
    Task<MatchStateDto> SpinAsync(string guidCode, string playerId);
    Task<MatchStateDto> GuessAsync(string guidCode, string playerId, string guess);
    Task<RematchResultDto> RequestRematchAsync(string guidCode, string challengerPlayerId);
    Task<RematchResultDto> AcceptRematchAsync(string guidCode, string responderPlayerId);
    Task<RematchResultDto> DeclineRematchAsync(string guidCode, string responderPlayerId);
}

public sealed class InMemoryMatchService : IMatchService
{
    private readonly ConcurrentDictionary<string, MatchState> _matches = new();
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _loopTokens = new();
    private readonly IMatchEngine _engine;
    private readonly IWordBankService _wordBank;
    private readonly IHubContext<MatchHub> _hubContext;

    public InMemoryMatchService(IMatchEngine engine, IWordBankService wordBank, IHubContext<MatchHub> hubContext)
    {
        _engine = engine;
        _wordBank = wordBank;
        _hubContext = hubContext;
    }

    public async Task<MatchStateDto> CreateMatchAsync(string hostName, Difficulty difficulty = Difficulty.Normal)
    {
        var match = _engine.CreateMatch(hostName, difficulty);
        _matches[match.GuidCode] = match;
        return await BroadcastAsync(match);
    }

    public async Task<MatchStateDto> JoinMatchAsync(string guidCode, string playerName)
    {
        var match = GetMatchState(guidCode);
        lock (match)
        {
            _engine.AddPlayer(match, playerName);
        }

        return await BroadcastAsync(match);
    }

    public async Task<MatchStateDto> MarkReadyAsync(string guidCode, string playerId)
    {
        var match = GetMatchState(guidCode);
        var startLoop = false;

        lock (match)
        {
            _engine.MarkReady(match, playerId);
            if (match.Status == MatchStatus.Lobby && match.Players.Count >= 2 && match.Players.All(p => p.IsReady))
            {
                _engine.StartNextRound(match, _wordBank.GetRandomWord(match.UsedWords, match.Difficulty));
                startLoop = true;
            }
        }

        var dto = await BroadcastAsync(match);
        if (startLoop)
        {
            StartLoop(match.GuidCode);
        }

        return dto;
    }

    public Task<MatchStateDto> GetMatchAsync(string guidCode)
    {
        var match = GetMatchState(guidCode);
        return Task.FromResult(_engine.ToDto(match));
    }

    public async Task<MatchStateDto> SpinAsync(string guidCode, string playerId)
    {
        var match = GetMatchState(guidCode);
        lock (match)
        {
            // If the round has ended, start the next round before allowing spin
            if (match.Status == MatchStatus.RoundEnded)
            {
                _engine.StartNextRound(match, _wordBank.GetRandomWord(match.UsedWords, match.Difficulty));
            }

            _engine.ApplySpin(match, playerId, _wordBank.GetRandomWheelValue());
        }

        return await BroadcastAsync(match);
    }

    public async Task<MatchStateDto> GuessAsync(string guidCode, string playerId, string guess)
    {
        var match = GetMatchState(guidCode);

        lock (match)
        {
            var (_, updated) = _engine.ApplyGuess(match, playerId, guess);
            if (updated.RoundResolved)
            {
                if (updated.CurrentRound >= updated.MaxRounds)
                {
                    _engine.FinishMatch(updated, DetermineResult(match));
                }
                else
                {
                    _engine.EndRound(updated, "Round finished.");
                    // Round will stay in RoundEnded status until next player spins
                }
            }
        }

        return await BroadcastAsync(match);
    }

    public async Task<RematchResultDto> RequestRematchAsync(string guidCode, string challengerPlayerId)
    {
        var originalMatch = GetMatchState(guidCode);
        RematchResultDto result;

        lock (originalMatch)
        {
            var challenger = originalMatch.Players.FirstOrDefault(p => p.PlayerId == challengerPlayerId)
                ?? throw new InvalidOperationException("Player not found in this match.");

            var opponent = originalMatch.Players.FirstOrDefault(p => p.PlayerId != challengerPlayerId)
                ?? throw new InvalidOperationException("A rematch requires an opponent.");

            var rematchMatch = _engine.CreateRematch(originalMatch, challenger.Name, challenger.PlayerId);
            _matches[rematchMatch.GuidCode] = rematchMatch;

            result = new RematchResultDto
            {
                OriginalGuidCode = originalMatch.GuidCode,
                RematchGuidCode = rematchMatch.GuidCode,
                ChallengerPlayerId = challengerPlayerId,
                ResponderPlayerId = opponent.PlayerId
            };
        }

        await _hubContext.Clients.Group(originalMatch.GuidCode).SendAsync("rematchChallenged", result);
        return result;
    }

    public async Task<RematchResultDto> AcceptRematchAsync(string guidCode, string responderPlayerId)
    {
        var originalMatch = GetMatchState(guidCode);
        MatchState rematchMatch;
        RematchResultDto result;

        lock (originalMatch)
        {
            var responder = originalMatch.Players.FirstOrDefault(p => p.PlayerId == responderPlayerId)
                ?? throw new InvalidOperationException("Player not found in this match.");

            if (string.IsNullOrWhiteSpace(originalMatch.PendingRematchId))
            {
                throw new InvalidOperationException("No rematch challenge is currently pending.");
            }

            rematchMatch = GetMatchStateById(originalMatch.PendingRematchId);

            lock (rematchMatch)
            {
                _engine.AddPlayer(rematchMatch, responder.Name, responder.PlayerId);
            }

            var challenger = originalMatch.Players.First(p => p.PlayerId != responderPlayerId);
            originalMatch.PendingRematchId = null;

            result = new RematchResultDto
            {
                OriginalGuidCode = originalMatch.GuidCode,
                RematchGuidCode = rematchMatch.GuidCode,
                ChallengerPlayerId = challenger.PlayerId,
                ResponderPlayerId = responderPlayerId
            };
        }

        await _hubContext.Clients.Group(originalMatch.GuidCode).SendAsync("rematchAccepted", result);
        await BroadcastAsync(rematchMatch);
        return result;
    }

    public async Task<RematchResultDto> DeclineRematchAsync(string guidCode, string responderPlayerId)
    {
        var originalMatch = GetMatchState(guidCode);
        RematchResultDto result;
        string? rematchId;

        lock (originalMatch)
        {
            var responder = originalMatch.Players.FirstOrDefault(p => p.PlayerId == responderPlayerId)
                ?? throw new InvalidOperationException("Player not found in this match.");

            rematchId = originalMatch.PendingRematchId;
            if (string.IsNullOrWhiteSpace(rematchId))
            {
                throw new InvalidOperationException("No rematch challenge is currently pending.");
            }

            _engine.DeclineRematch(originalMatch);

            var challenger = originalMatch.Players.First(p => p.PlayerId != responderPlayerId);
            result = new RematchResultDto
            {
                OriginalGuidCode = originalMatch.GuidCode,
                RematchGuidCode = string.Empty,
                ChallengerPlayerId = challenger.PlayerId,
                ResponderPlayerId = responderPlayerId
            };
        }

        RemoveMatchById(rematchId);
        await _hubContext.Clients.Group(originalMatch.GuidCode).SendAsync("rematchDeclined", result);
        return result;
    }

    private void StartLoop(string guidCode)
    {
        var tokenSource = new CancellationTokenSource();
        if (_loopTokens.TryGetValue(guidCode, out var existing))
        {
            existing.Cancel();
            existing.Dispose();
        }
        _loopTokens[guidCode] = tokenSource;

        _ = Task.Run(() => RunLoopAsync(guidCode, tokenSource.Token));
    }

    private async Task RunLoopAsync(string guidCode, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            var match = GetMatchState(guidCode);
            var shouldBroadcast = false;

            lock (match)
            {
                if (match.Status is MatchStatus.Finished or MatchStatus.Lobby)
                {
                    return;
                }

                if (match.Status == MatchStatus.RoundEnded)
                {
                    continue;
                }

                if (match.RoundResolved)
                {
                    continue;
                }

                // Do not start the countdown or reveal letters until the active player
                // has spun the wheel for this turn. The spin sets CurrentWheelValue;
                // until then, keep the timer paused and do not reveal letters.
                if (match.CurrentWheelValue is null)
                {
                    continue;
                }

                // Decrement timer and increment elapsed time
                match.SecondsLeft = Math.Max(match.SecondsLeft - 1, 0);
                match.ElapsedSecondsSinceSpin += 1;
                shouldBroadcast = true;

                // Letter reveal logic (only during normal turns, not final guess)
                // First letter is revealed immediately on spin (in ApplySpin)
                // Reveal schedule:
                // - 2nd letter at 5 seconds
                // - 3rd letter at 10 seconds
                // - Subsequent letters every LetterRevealIntervalSeconds (default 8s)
                // - 3rd-to-last and 2nd-to-last letters at 10 second intervals
                // - Stop when only 1 letter remains unrevealed
                if (!match.IsFinalGuess)
                {
                    var elapsed = match.ElapsedSecondsSinceSpin;
                    var currentRevealed = match.RevealedIndexes.Count;
                    var totalLetters = match.CurrentWord.Length;
                    var unrevealed = totalLetters - currentRevealed;

                    // Only reveal if there's more than 1 letter remaining
                    if (unrevealed > 1)
                    {
                        bool shouldReveal = false;

                        if (currentRevealed == 1 && elapsed == 5)
                        {
                            // Reveal 2nd letter at exactly 5 seconds
                            shouldReveal = true;
                        }
                        else if (currentRevealed == 2 && elapsed == 10)
                        {
                            // Reveal 3rd letter at exactly 10 seconds
                            shouldReveal = true;
                        }
                        else if (currentRevealed >= 3)
                        {
                            // Calculate how many letters from the end this will be after reveal
                            var lettersFromEndAfterReveal = totalLetters - (currentRevealed + 1);

                            // Determine the interval to use
                            int interval;
                            if (lettersFromEndAfterReveal == 2 || lettersFromEndAfterReveal == 1)
                            {
                                // 3rd-to-last and 2nd-to-last use 10 second intervals
                                interval = 10;
                            }
                            else
                            {
                                // All other letters use the standard interval (default 8s)
                                interval = match.LetterRevealIntervalSeconds;
                            }

                            // Calculate expected reveal time based on cumulative intervals
                            var baseTime = 10; // Start after the 3rd letter (at 10s)
                            var cumulativeTime = baseTime;

                            // Calculate the cumulative time for this letter position
                            for (int i = 3; i < currentRevealed; i++)
                            {
                                var lettersFromEndAtPosition = totalLetters - (i + 1);
                                if (lettersFromEndAtPosition == 2 || lettersFromEndAtPosition == 1)
                                {
                                    cumulativeTime += 10;
                                }
                                else
                                {
                                    cumulativeTime += match.LetterRevealIntervalSeconds;
                                }
                            }

                            cumulativeTime += interval;

                            if (elapsed == cumulativeTime)
                            {
                                shouldReveal = true;
                            }
                        }

                        if (shouldReveal)
                        {
                            _engine.RevealNextLetter(match);
                        }
                    }
                }

                // Check if timer has expired
                if (match.SecondsLeft == 0)
                {
                    // If this is a final guess and timer runs out, end the round with no reward
                    if (match.IsFinalGuess)
                    {
                        var activePlayerName = match.Players[match.ActivePlayerIndex].Name;
                        var wheelValue = match.CurrentWheelValue ?? 0;

                        if (match.CurrentRound >= match.MaxRounds)
                        {
                            _engine.FinishMatch(match, $"{activePlayerName} failed to guess. No reward given. "+ DetermineResult(match));
                        }
                        else
                        {
                            _engine.EndRound(match, $"{activePlayerName} failed to guess. No one received the {wheelValue} points.");
                            // Round will stay in RoundEnded status until next player spins
                        }
                    }
                    else
                    {
                        // Normal timer expiry - rotate turn for final guess
                        _engine.RotateTurn(match);
                    }
                }
            }

            if (shouldBroadcast)
            {
                await BroadcastAsync(match);
            }
        }
    }

    private static string DetermineResult(MatchState match)
    {
        var topScore = match.Players.Max(p => p.Score);
        var winners = match.Players.Where(p => p.Score == topScore).ToList();

        return winners.Count > 1
            ? "The match ends in a draw!"
            : $"{winners[0].Name} wins the match.";
    }

    private MatchState GetMatchState(string guidCode)
    {
        return _matches.TryGetValue(guidCode.ToUpperInvariant(), out var match)
            ? match
            : throw new KeyNotFoundException("Match not found.");
    }

    private MatchState GetMatchStateById(string matchId)
    {
        foreach (var entry in _matches)
        {
            if (entry.Value.MatchId == matchId)
            {
                return entry.Value;
            }
        }

        throw new KeyNotFoundException("Match not found.");
    }

    private void RemoveMatchById(string? matchId)
    {
        if (string.IsNullOrWhiteSpace(matchId))
        {
            return;
        }

        string? matchGuidCode = null;
        foreach (var entry in _matches)
        {
            if (entry.Value.MatchId == matchId)
            {
                matchGuidCode = entry.Key;
                break;
            }
        }

        if (matchGuidCode is null)
        {
            return;
        }

        _matches.TryRemove(matchGuidCode, out _);

        if (_loopTokens.TryRemove(matchGuidCode, out var tokenSource))
        {
            tokenSource.Cancel();
            tokenSource.Dispose();
        }
    }

    private async Task<MatchStateDto> BroadcastAsync(MatchState match)
    {
        var dto = _engine.ToDto(match);
        await _hubContext.Clients.Group(match.GuidCode).SendAsync("matchUpdated", dto);
        return dto;
    }
}