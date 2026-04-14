using FluentAssertions;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class MatchEngineTests
{
    private readonly MatchEngine _engine = new();

    [Fact]
    public void CreateMatch_ShouldCreateLobbyWithOnePlayer()
    {
        var match = _engine.CreateMatch("Christian");

        match.Status.Should().Be(MatchStatus.Lobby);
        match.Players.Should().HaveCount(1);
        match.Players[0].Name.Should().Be("Christian");
    }

    [Fact]
    public void StartNextRound_ShouldPickFirstPlayerAsActiveInRoundOne()
    {
        var match = _engine.CreateMatch("A");
        _engine.AddPlayer(match, "B");
        _engine.MarkReady(match, match.Players[0].PlayerId);
        _engine.MarkReady(match, match.Players[1].PlayerId);

        _engine.StartNextRound(match, "socket");

        match.Status.Should().Be(MatchStatus.InProgress);
        match.CurrentRound.Should().Be(1);
        match.ActivePlayerId.Should().Be(match.Players[0].PlayerId);
        match.CurrentWord.Should().Be("SOCKET");
    }

    [Fact]
    public void ApplyGuess_ShouldAwardPointsWhenGuessIsCorrect()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor");
        _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        var (isCorrect, updated) = _engine.ApplyGuess(match, match.ActivePlayerId!, "reactor");

        isCorrect.Should().BeTrue();
        updated.Players[0].Score.Should().Be(300);
        updated.RoundResolved.Should().BeTrue();
    }

    private MatchState BuildReadyMatch()
    {
        var match = _engine.CreateMatch("A");
        _engine.AddPlayer(match, "B");
        _engine.MarkReady(match, match.Players[0].PlayerId);
        _engine.MarkReady(match, match.Players[1].PlayerId);
        return match;
    }
}
