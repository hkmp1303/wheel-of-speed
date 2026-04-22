namespace WheelOfSpeed.Models;

public enum Difficulty
{
    Easy,
    Normal,
    Hard
}

public enum MatchStatus
{
    Lobby,
    InProgress,
    RoundEnded,
    Finished
}

public sealed record CreateMatchRequest(string HostName, Difficulty Difficulty = Difficulty.Normal, int MaxRounds = 4);
public sealed record JoinMatchRequest(string PlayerName);
public sealed record ReadyRequest(string PlayerId);
public sealed record SpinRequest(string PlayerId);
public sealed record GuessRequest(string PlayerId, string Guess);
public sealed record RematchChallengeRequest(string PlayerId);
public sealed record RematchResponseRequest(string PlayerId, bool Accept);

public sealed class RematchResultDto
{
    public string OriginalGuidCode { get; init; } = string.Empty;
    public string RematchGuidCode { get; init; } = string.Empty;
    public string ChallengerPlayerId { get; init; } = string.Empty;
    public string ResponderPlayerId { get; init; } = string.Empty;
}

public sealed class MatchStateDto
{
    public string MatchId { get; init; } = string.Empty;
    public string GuidCode { get; init; } = string.Empty;
    public MatchStatus Status { get; init; }
    public int CurrentRound { get; init; }
    public int MaxRounds { get; init; }
    public string? ActivePlayerId { get; init; }
    public string? ActivePlayerName { get; init; }
    public int SecondsLeft { get; init; }
    public string MaskedWord { get; init; } = string.Empty;
    public int? CurrentWheelValue { get; init; }
    public string? LastMessage { get; init; }
    public string? LastMessageClass { get; init; }
    public string? GameOverMessage { get; init; }
    public string? LastGuessedWord { get; init; }
    public IReadOnlyList<PlayerStateDto> Players { get; init; } = [];
    public bool IsFinalGuess { get; init; }
}

public sealed class PlayerStateDto
{
    public string PlayerId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int Score { get; init; }
    public bool IsReady { get; init; }
    public bool IsActiveTurn { get; init; }
}

public sealed class MatchState
{
    public string MatchId { get; set; } = Guid.NewGuid().ToString("N");
    public string GuidCode { get; set; } = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    public MatchStatus Status { get; set; } = MatchStatus.Lobby;
    public int CurrentRound { get; set; } = 0;
    public int MaxRounds { get; set; } = 4;
    public string? ActivePlayerId { get; set; }
    public int ActivePlayerIndex { get; set; }
    public int SecondsLeft { get; set; } = 45;
    public string CurrentWord { get; set; } = string.Empty;
    public HashSet<int> RevealedIndexes { get; set; } = [];
    public int? CurrentWheelValue { get; set; }
    public string? LastMessage { get; set; }
    public string? LastMessageClass { get; set; }
    public string? GameOverMessage { get; set; }
    public string? LastGuessedWord { get; set; }
    public List<PlayerState> Players { get; set; } = [];
    public bool RoundResolved { get; set; }
    public bool IsFinalGuess { get; set; }
    public int ElapsedSecondsSinceSpin { get; set; } = 0;
    public int LetterRevealIntervalSeconds { get; set; } = 8;
    public List<string> UsedWords { get; set; } = [];
    public Difficulty Difficulty { get; set; } = Difficulty.Normal;
    public string? PendingRematchId { get; set; }
}

public sealed class PlayerState
{
    public string PlayerId { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool IsReady { get; set; }
}