using WheelOfSpeed.Models;

namespace WheelOfSpeed.Services;

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
    MatchState RevealAllLetters(MatchState match);
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

        // Calculate timer based on word length
        match.SecondsLeft = CalculateTimerForWord(match.CurrentWord.Length, match.LetterRevealIntervalSeconds);

        match.CurrentWheelValue = null;
        match.RoundResolved = false;
        match.IsFinalGuess = false;
        match.ElapsedSecondsSinceSpin = 0;
        match.ActivePlayerIndex = (match.CurrentRound - 1) % match.Players.Count;
        match.ActivePlayerId = match.Players[match.ActivePlayerIndex].PlayerId;
        match.LastMessage = $"Round {match.CurrentRound} started.";
        match.LastMessageClass = null; // Reset color to default (white)
        return match;
    }

    /// <summary>
    /// Calculates the timer duration based on word length.
    /// Includes time for all letter reveals plus 10 seconds buffer after 2nd-to-last letter.
    /// </summary>
    private int CalculateTimerForWord(int wordLength, int standardInterval)
    {
        if (wordLength < 2) return 30; // Minimum timer for very short words

        // Calculate time when 2nd-to-last letter (all but 1) will be revealed
        // Letter reveal schedule:
        // 1st: 0s (on spin)
        // 2nd: 5s
        // 3rd: 10s
        // 4th+: every standardInterval (8s default)
        // 3rd-to-last and 2nd-to-last: 10s intervals

        int timeToRevealSecondToLast = 0;

        if (wordLength == 2)
        {
            // Only 1 letter will be revealed (1st on spin), 2nd-to-last is revealed at 0s
            timeToRevealSecondToLast = 0;
        }
        else if (wordLength == 3)
        {
            // 1st at 0s, 2nd at 5s (this is 2nd-to-last)
            timeToRevealSecondToLast = 5;
        }
        else if (wordLength == 4)
        {
            // 1st at 0s, 2nd at 5s, 3rd at 10s (this is 2nd-to-last)
            timeToRevealSecondToLast = 10;
        }
        else
        {
            // For longer words, calculate cumulative time
            int time = 10; // Start after 3rd letter at 10s
            int lettersRevealed = 3; // Already revealed 1st, 2nd, 3rd
            int lettersToReveal = wordLength - 1; // Total letters to reveal (all but last)

            // Reveal letters 4 through (wordLength - 1)
            while (lettersRevealed < lettersToReveal)
            {
                int lettersFromEnd = wordLength - (lettersRevealed + 1);

                // 3rd-to-last and 2nd-to-last use 10s intervals
                if (lettersFromEnd == 2 || lettersFromEnd == 1)
                {
                    time += 10;
                }
                else
                {
                    time += standardInterval;
                }

                lettersRevealed++;
            }

            timeToRevealSecondToLast = time;
        }

        // Add 10 second buffer after 2nd-to-last letter revealed
        return timeToRevealSecondToLast + 10;
    }

    public MatchState RotateTurn(MatchState match)
    {
        EnsureInProgress(match);

        if (match.RoundResolved)
        {
            throw new InvalidOperationException("Cannot rotate turn after the round has been resolved.");
        }

        // Check if the previous turn had a wheel value (player spun but didn't guess correctly)
        // If so, give the next player a final guess opportunity with the locked wheel value
        var hadWheelValue = match.CurrentWheelValue.HasValue;

        match.ActivePlayerIndex = (match.ActivePlayerIndex + 1) % match.Players.Count;
        match.ActivePlayerId = match.Players[match.ActivePlayerIndex].PlayerId;

        if (hadWheelValue && !match.IsFinalGuess)
        {
            // This is a final guess turn - give 20 seconds and keep the wheel value locked
            match.SecondsLeft = 20;
            match.IsFinalGuess = true;
            match.ElapsedSecondsSinceSpin = 0; // Reset elapsed time for final guess
            match.LastMessage = $"{match.Players[match.ActivePlayerIndex].Name} has a final guess with the locked wheel value!";
        }
        else
        {
            // Normal turn rotation - reset to 45 seconds and clear wheel value
            match.SecondsLeft = 45;
            match.CurrentWheelValue = null;
            match.IsFinalGuess = false;
            match.ElapsedSecondsSinceSpin = 0;
            match.LastMessage = $"It is now {match.Players[match.ActivePlayerIndex].Name}'s turn.";
        }

        return match;
    }

    public MatchState ApplySpin(MatchState match, string playerId, int wheelValue)
    {
        ValidateNotEmpty(playerId, nameof(playerId));
        EnsureInProgress(match);
        EnsureActivePlayer(match, playerId);

        if (match.IsFinalGuess)
        {
            throw new InvalidOperationException("Cannot spin the wheel during a final guess. The wheel value is locked.");
        }

        if (match.CurrentWheelValue is not null)
        {
            throw new InvalidOperationException("You have already spun the wheel this turn.");
        }

        match.CurrentWheelValue = wheelValue;
        match.ElapsedSecondsSinceSpin = 0;

        // Reveal first letter immediately upon spin
        RevealNextLetter(match);

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

        var trimmedGuess = guess.Trim();
        match.LastGuessedWord = trimmedGuess.ToUpperInvariant();

        if (string.Equals(match.CurrentWord, trimmedGuess, StringComparison.OrdinalIgnoreCase))
        {
            var player = EnsurePlayer(match, playerId);
            player.Score += match.CurrentWheelValue.Value;
            match.RoundResolved = true;

            match.LastMessage = $"Correct answer, {player.Name} is awarded {match.CurrentWheelValue.Value} points.";
            match.LastMessageClass = "correct-answer"; // CSS class for correct answer styling

            return (true, match);
        }

        // Incorrect guess - allow player to keep guessing
        // During final guess, player can make multiple guesses until timer expires
        if (match.IsFinalGuess)
        {
            match.LastMessage = "Incorrect guess. Try again!";
        }
        else
        {
            match.LastMessage = "Incorrect guess. Keep going.";
        }

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
        return match;
    }

    public MatchState EndRound(MatchState match, string message)
    {
        EnsureInProgress(match);

        match.Status = MatchStatus.RoundEnded;
        match.SecondsLeft = 0;
        match.CurrentWheelValue = null;
        match.IsFinalGuess = false;

        // Only update message if one isn't already set (preserve correct answer message and its styling)
        if (string.IsNullOrEmpty(match.LastMessage))
        {
            match.LastMessage = message;
            match.LastMessageClass = null;
        }

        // Reveal all remaining letters so players can see the word
        RevealAllLetters(match);

        // Set active player to whoever will start the NEXT round
        // This is based on the next round number, using the same logic as StartNextRound
        var nextRoundNumber = match.CurrentRound + 1;
        match.ActivePlayerIndex = (nextRoundNumber - 1) % match.Players.Count;
        match.ActivePlayerId = match.Players[match.ActivePlayerIndex].PlayerId;

        return match;
    }

    /// <summary>
    /// Reveals all letters in the current word.
    /// </summary>
    public MatchState RevealAllLetters(MatchState match)
    {
        for (int i = 0; i < match.CurrentWord.Length; i++)
        {
            match.RevealedIndexes.Add(i);
        }
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
        match.IsFinalGuess = false;

        // Only update message if one isn't already set (preserve correct answer message and its styling)
        if (string.IsNullOrEmpty(match.LastMessage))
        {
            match.LastMessage = null;
        }

        match.GameOverMessage = message;

        // Reveal all remaining letters so players can see the final word
        RevealAllLetters(match);

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
            LastMessageClass = match.LastMessageClass,
            GameOverMessage = match.GameOverMessage,
            LastGuessedWord = match.LastGuessedWord,
            IsFinalGuess = match.IsFinalGuess,
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

    private static readonly int[] WheelValues = new[] { 50, 100, 200, 300, 500, 1000 };

    /// <summary>
    /// Generate a wheel reward amount.
    /// Optional seed parameter for deterministic testing.
    /// </summary>
    public int GenerateSpinReward(int? seed = null)
    {
        var rnd = seed.HasValue ? new Random(seed.Value) : new Random();
        var idx = rnd.Next(0, WheelValues.Length);
        return WheelValues[idx];
    }
}
