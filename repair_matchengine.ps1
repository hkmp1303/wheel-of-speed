$f = "C:\Users\chris\OneDrive\Skrivbord\KODNING\wheel-of-speed\Server\Core\Game\MatchEngine.cs"
$c = Get-Content $f -Raw

# Find exact cut points
$messStart = $c.IndexOf("    public MatchStateDto ToDto(MatchState match)`n        public MatchState CreateRematch")
# The clean ToDto body is identified by "    {\n        return new MatchStateDto"
$cleanBodyStart = $c.IndexOf("    {`n        return new MatchStateDto")

Write-Host "messStart=$messStart  cleanBodyStart=$cleanBodyStart"

if ($messStart -eq -1 -or $cleanBodyStart -eq -1) {
    Write-Host "ERROR: Could not find markers"
    exit 1
}

# Build replacement text for the methods we insert between FinishMatch and ToDto body
$replacement = @"

    public MatchState CreateRematch(MatchState finishedMatch, string challengerName)
    {
        ValidateNotEmpty(challengerName, nameof(challengerName));

        if (finishedMatch.Status != MatchStatus.Finished)
            throw new InvalidOperationException("A rematch can only be initiated from a finished match.");

        if (finishedMatch.PendingRematchId is not null)
            throw new InvalidOperationException("A rematch is already pending for this match.");

        var newMatch = new MatchState
        {
            Difficulty = finishedMatch.Difficulty,
            MaxRounds = finishedMatch.MaxRounds
        };

        newMatch.Players.Add(new PlayerState { Name = challengerName.Trim() });
        newMatch.LastMessage = "Rematch lobby created. Waiting for opponent.";

        finishedMatch.PendingRematchId = newMatch.MatchId;

        return newMatch;
    }

    public MatchState DeclineRematch(MatchState finishedMatch)
    {
        finishedMatch.PendingRematchId = null;
        finishedMatch.LastMessage = "Rematch was declined.";
        return finishedMatch;
    }

    public MatchStateDto ToDto(MatchState match)
"@

# Compose the clean file: everything before the mess + new methods + clean ToDto body onwards
$cleanContent = $c.Substring(0, $messStart) + $replacement + $c.Substring($cleanBodyStart)

# Verify the result has exactly one occurrence of each new method
$createCount = ([regex]::Matches($cleanContent, "public MatchState CreateRematch")).Count
$declineCount = ([regex]::Matches($cleanContent, "public MatchState DeclineRematch")).Count
$toDtoCount = ([regex]::Matches($cleanContent, "public MatchStateDto ToDto\(MatchState match\)")).Count

Write-Host "CreateRematch occurrences: $createCount"
Write-Host "DeclineRematch occurrences: $declineCount"
Write-Host "ToDto occurrences: $toDtoCount"

if ($createCount -eq 1 -and $declineCount -eq 1 -and $toDtoCount -eq 1) {
    $cleanContent | Set-Content $f -NoNewline
    Write-Host "SUCCESS: File written cleanly"
} else {
    Write-Host "ABORTED: Unexpected method counts - file not written"
}