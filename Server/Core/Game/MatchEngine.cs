using WheelOfSpeed.Models;

namespace WheelOfSpeed;

public interface IMatchEngine
{
    MatchState CreateMatch(string hostName);
    MatchState AddPlayer(MatchState match, string playerName);
    MatchState MarkReady(MatchState match, string playerId);
    MatchState StartNextRound(MatchState match, string word);
    MatchState RotateTurn(MatchState match);
    MatchState ApplySpin(MatchState match, string playerId, int wheelValue);
    (bool IsCorrect, MatchState UpdatedMatch) ApplyGuess(MatchState match, string playerId, string guess);
    MatchState RevealNextLetter(MatchState match);
    MatchState EndRound(MatchState match, string message);
    MatchState FinishMatch(MatchState match, string message);
    MatchStateDto ToDto(MatchState match);
}

public sealed class MatchEngine : IMatchEngine
{
    public MatchState CreateMatch(string hostName)
    {
        ValidateNotEmpty(hostName, nameof(hostName));

        var match = new MatchState();
        match.Players.Add(new PlayerState { Name = hostName.Trim() });
        match.LastMessage = "Lobby created. Share the code with another player.";
        return match;
    }

    public MatchState AddPlayer(MatchState match, string playerName)
    {
        ValidateNotEmpty(playerName, nameof(playerName));
        EnsureLobby(match);

        var trimmedName = playerName.Trim();

        if (match.Players.Any(p => string.Equals(p.Name, trimmedName, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("A player with that name already exists in the match.");
        }

        match.Players.Add(new PlayerState { Name = trimmedName });
        match.LastMessage = $"{trimmedName} joined the lobby.";
        return match;
    }

    public MatchState MarkReady(MatchState match, string playerId)
    {
        ValidateNotEmpty(playerId, nameof(playerId));
        EnsureLobby(match);

        EnsurePlayer(match, playerId).IsReady = true;
        match.LastMessage = "Player marked as ready.";
        return match;
    }

    public MatchState StartNextRound(MatchState match, string word)
    {
        ValidateNotEmpty(word, nameof(word));

        if (match.Players.Count < 2)
        {
            throw new InvalidOperationException("At least two players are required to start.");
        }

        // IsReady is only enforced for the very first round; subsequent rounds start automatically.
        if (match.CurrentRound == 0 && !match.Players.All(p => p.IsReady))
        {
            throw new InvalidOperationException("All players must be ready before the match can start.");
        }

        match.Status = MatchStatus.InProgress;
        match.CurrentRound += 1;
        match.CurrentWord = word.ToUpperInvariant();
        match.RevealedIndexes = [];
        match.SecondsLeft = 45;
        match.CurrentWheelValue = null;
        match.RoundResolved = false;
        match.ActivePlayerIndex = (match.CurrentRound - 1) % match.Players.Count;
        match.ActivePlayerId = match.Players[match.ActivePlayerIndex].PlayerId;
        match.LastMessage = $"Round {match.CurrentRound} started.";
        return match;
    }

    public MatchState RotateTurn(MatchState match)
    {
        EnsureInProgress(match);

        if (match.RoundResolved)
        {
            throw new InvalidOperationException("Cannot rotate turn after the round has been resolved.");
        }

        match.ActivePlayerIndex = (match.ActivePlayerIndex + 1) % match.Players.Count;
        match.ActivePlayerId = match.Players[match.ActivePlayerIndex].PlayerId;
        match.SecondsLeft = 45;
        match.CurrentWheelValue = null;
        match.LastMessage = $"It is now {match.Players[match.ActivePlayerIndex].Name}'s turn.";
        return match;
    }

    public MatchState ApplySpin(MatchState match, string playerId, int wheelValue)
    {
        ValidateNotEmpty(playerId, nameof(playerId));
        EnsureInProgress(match);
        EnsureActivePlayer(match, playerId);

        if (match.CurrentWheelValue is not null)
        {
            throw new InvalidOperationException("You have already spun the wheel this turn.");
        }

        match.CurrentWheelValue = wheelValue;
        match.LastMessage = $"Wheel landed on {wheelValue} points.";
        return match;
    }

    public (bool IsCorrect, MatchState UpdatedMatch) ApplyGuess(MatchState match, string playerId, string guess)
    {
        ValidateNotEmpty(playerId, nameof(playerId));
        ValidateNotEmpty(guess, nameof(guess));
        EnsureInProgress(match);
        EnsureActivePlayer(match, playerId);

        if (match.CurrentWheelValue is null)
        {
            throw new InvalidOperationException("You must spin the wheel before guessing.");
        }

        if (string.Equals(match.CurrentWord, guess.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var player = EnsurePlayer(match, playerId);
            player.Score += match.CurrentWheelValue.Value;
            match.RoundResolved = true;
            match.LastMessage = $"{player.Name} guessed the word and won {match.CurrentWheelValue.Value} points.";
            return (true, match);
        }

        match.LastMessage = "Incorrect guess. Keep going.";
        return (false, match);
    }

    public MatchState RevealNextLetter(MatchState match)
    {
        EnsureInProgress(match);
        if (match.RevealedIndexes.Count >= match.CurrentWord.Length)
        {
            return match;
        }

        var remaining = Enumerable.Range(0, match.CurrentWord.Length)
            .Where(index => !match.RevealedIndexes.Contains(index))
            .ToList();

        var nextIndex = remaining[Random.Shared.Next(remaining.Count)];
        match.RevealedIndexes.Add(nextIndex);
        match.LastMessage = "A new letter was revealed.";
        return match;
    }

    public MatchState EndRound(MatchState match, string message)
    {
        EnsureInProgress(match);

        match.Status = MatchStatus.RoundEnded;
        match.SecondsLeft = 0;
        match.CurrentWheelValue = null;
        match.LastMessage = message;
        return match;
    }

    public MatchState FinishMatch(MatchState match, string message)
    {
        if (match.Status is MatchStatus.Finished or MatchStatus.Lobby)
        {
            throw new InvalidOperationException("The match cannot be finished from its current state.");
        }

        match.Status = MatchStatus.Finished;
        match.SecondsLeft = 0;
        match.CurrentWheelValue = null;
        match.LastMessage = message;
        return match;
    }

    public MatchStateDto ToDto(MatchState match)
    {
        return new MatchStateDto
        {
            MatchId = match.MatchId,
            GuidCode = match.GuidCode,
            Status = match.Status,
            CurrentRound = match.CurrentRound,
            MaxRounds = match.MaxRounds,
            ActivePlayerId = match.ActivePlayerId,
            ActivePlayerName = match.Players.FirstOrDefault(p => p.PlayerId == match.ActivePlayerId)?.Name,
            SecondsLeft = match.SecondsLeft,
            MaskedWord = BuildMaskedWord(match.CurrentWord, match.RevealedIndexes),
            CurrentWheelValue = match.CurrentWheelValue,
            LastMessage = match.LastMessage,
            Players = match.Players.Select(p => new PlayerStateDto
            {
                PlayerId = p.PlayerId,
                Name = p.Name,
                Score = p.Score,
                IsReady = p.IsReady,
                IsActiveTurn = p.PlayerId == match.ActivePlayerId
            }).ToList()
        };
    }

    private static string BuildMaskedWord(string word, HashSet<int> revealedIndexes)
    {
        if (string.IsNullOrWhiteSpace(word)) return string.Empty;
        var chars = word.Select((c, index) => revealedIndexes.Contains(index) ? c : '_');
        return string.Join(' ', chars);
    }

    private static void ValidateNotEmpty(string value, string paramName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, paramName);
    }

    private static void EnsureLobby(MatchState match)
    {
        if (match.Status != MatchStatus.Lobby)
        {
            throw new InvalidOperationException("This action can only be performed while the match is in the lobby.");
        }
    }

    private static void EnsureInProgress(MatchState match)
    {
        if (match.Status != MatchStatus.InProgress)
        {
            throw new InvalidOperationException("The match is not currently in progress.");
        }
    }

    private static PlayerState EnsurePlayer(MatchState match, string playerId)
    {
        return match.Players.FirstOrDefault(p => p.PlayerId == playerId)
            ?? throw new InvalidOperationException("Player not found in this match.");
    }

    private static void EnsureActivePlayer(MatchState match, string playerId)
    {
        if (match.ActivePlayerId != playerId)
        {
            throw new InvalidOperationException("It is not this player's turn.");
        }
    }
}
