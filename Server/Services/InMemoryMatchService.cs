using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using WheelOfSpeed.Hubs;
using WheelOfSpeed.Models;

namespace WheelOfSpeed.Services;

public interface IMatchService
{
    Task<MatchStateDto> CreateMatchAsync(string hostName, Difficulty difficulty);
    Task<MatchStateDto> JoinMatchAsync(string guidCode, string playerName);
    Task<MatchStateDto> MarkReadyAsync(string guidCode, string playerId);
    Task<MatchStateDto> GetMatchAsync(string guidCode);
    Task<MatchStateDto> SpinAsync(string guidCode, string playerId);
    Task<MatchStateDto> GuessAsync(string guidCode, string playerId, string guess);
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

    public async Task<MatchStateDto> CreateMatchAsync(string hostName, Difficulty difficulty)
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
                _engine.StartNextRound(match, _wordBank.GetRandomWord());
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
            _engine.ApplySpin(match, playerId, _wordBank.GetRandomWheelValue());
        }

        return await BroadcastAsync(match);
    }

    public async Task<MatchStateDto> GuessAsync(string guidCode, string playerId, string guess)
    {
        var match = GetMatchState(guidCode);
        var shouldAdvance = false;

        lock (match)
        {
            var (_, updated) = _engine.ApplyGuess(match, playerId, guess);
            if (updated.RoundResolved)
            {
                if (updated.CurrentRound >= updated.MaxRounds)
                {
                    var winner = updated.Players.OrderByDescending(p => p.Score).First();
                    _engine.FinishMatch(updated, $"{winner.Name} wins the match.");
                }
                else
                {
                    _engine.EndRound(updated, "Round finished. Next round will begin shortly.");
                    shouldAdvance = true;
                }
            }
        }

        var dto = await BroadcastAsync(match);
        if (shouldAdvance)
        {
            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromSeconds(3));
                var roundStarted = false;
                lock (match)
                {
                    if (match.Status == MatchStatus.RoundEnded)
                    {
                        _engine.StartNextRound(match, _wordBank.GetRandomWord());
                        roundStarted = true;
                    }
                }

                if (roundStarted)
                {
                    await BroadcastAsync(match);
                }
            });
        }

        return dto;
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
        var revealCounter = 0;

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
            var shouldAdvance = false;

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

                // Skip game logic if the round was already resolved by a guess
                if (match.RoundResolved)
                {
                    continue;
                }

                match.SecondsLeft = Math.Max(match.SecondsLeft - 1, 0);
                revealCounter += 1;
                shouldBroadcast = true;

                if (revealCounter >= 8)
                {
                    _engine.RevealNextLetter(match);
                    revealCounter = 0;
                }

                // Check if all letters revealed before rotating turn
                if (match.RevealedIndexes.Count == match.CurrentWord.Length)
                {
                    if (match.CurrentRound >= match.MaxRounds)
                    {
                        var winner = match.Players.OrderByDescending(p => p.Score).First();
                        _engine.FinishMatch(match, $"All letters were revealed. {winner.Name} wins the match.");
                    }
                    else
                    {
                        _engine.EndRound(match, "All letters were revealed. Starting next round.");
                        shouldAdvance = true;
                    }
                }
                else if (match.SecondsLeft == 0)
                {
                    _engine.RotateTurn(match);
                }
            }

            if (shouldBroadcast)
            {
                await BroadcastAsync(match);
            }

            if (shouldAdvance)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    return;
                }

                var roundStarted = false;
                lock (match)
                {
                    if (match.Status == MatchStatus.RoundEnded)
                    {
                        _engine.StartNextRound(match, _wordBank.GetRandomWord());
                        revealCounter = 0;
                        roundStarted = true;
                    }
                }
                if (roundStarted)
                {
                    await BroadcastAsync(match);
                }
            }
        }
    }

    private MatchState GetMatchState(string guidCode)
    {
        return _matches.TryGetValue(guidCode.ToUpperInvariant(), out var match)
            ? match
            : throw new KeyNotFoundException("Match not found.");
    }

    private async Task<MatchStateDto> BroadcastAsync(MatchState match)
    {
        var dto = _engine.ToDto(match);
        await _hubContext.Clients.Group(match.GuidCode).SendAsync("matchUpdated", dto);
        return dto;
    }
}
