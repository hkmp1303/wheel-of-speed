using FluentAssertions;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class TiePointSystemTests
{
    private readonly MatchEngine _engine = new();

    private MatchState BuildFinishedMatch(int aliceScore, int bobScore)
    {
        var match = _engine.CreateMatch("Alice");
        _engine.AddPlayer(match, "Bob");
        _engine.MarkReady(match, match.Players[0].PlayerId);
        _engine.MarkReady(match, match.Players[1].PlayerId);
        _engine.StartNextRound(match, "test");
        match.Players[0].Score = aliceScore;
        match.Players[1].Score = bobScore;
        return match;
    }

    [Fact]
    public void FinishMatch_ShouldDeclareWinner_WhenOnePlayerHasMorePoints()
    {
        var match = BuildFinishedMatch(aliceScore: 300, bobScore: 100);
        _engine.EndRound(match, "Round ended.");

        _engine.FinishMatch(match, DetermineResult(match));

        match.LastMessage.Should().Contain("Alice");
        match.LastMessage.Should().Contain("wins");
    }

    [Fact]
    public void FinishMatch_ShouldDeclareDraw_WhenBothPlayersHaveEqualPoints()
    {
        var match = BuildFinishedMatch(aliceScore: 200, bobScore: 200);
        _engine.EndRound(match, "Round ended.");

        _engine.FinishMatch(match, DetermineResult(match));

        match.LastMessage.Should().Contain("draw");
    }

    [Fact]
    public void FinishMatch_ShouldDeclareDraw_WhenBothPlayersHaveZeroPoints()
    {
        var match = BuildFinishedMatch(aliceScore: 0, bobScore: 0);
        _engine.EndRound(match, "Round ended.");

        _engine.FinishMatch(match, DetermineResult(match));

        match.LastMessage.Should().Contain("draw");
    }

    private static string DetermineResult(MatchState match)
    {
        var topScore = match.Players.Max(p => p.Score);
        var winners = match.Players.Where(p => p.Score == topScore).ToList();

        return winners.Count > 1
            ? "The match ends in a draw!"
            : $"{winners[0].Name} wins the match.";
    }
}
