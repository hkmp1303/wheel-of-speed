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

    [Fact]
    public void AddPlayer_ShouldThrow_WhenNameAlreadyExists()
    {
        var match = _engine.CreateMatch("Alice");

        var act = () => _engine.AddPlayer(match, "alice");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public void StartNextRound_ShouldThrow_WhenNotAllPlayersReadyOnFirstRound()
    {
        var match = _engine.CreateMatch("A");
        _engine.AddPlayer(match, "B");
        _engine.MarkReady(match, match.Players[0].PlayerId);

        var act = () => _engine.StartNextRound(match, "socket");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*must be ready*");
    }

    [Fact]
    public void ApplySpin_ShouldThrow_WhenPlayerIsNotActive()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "network");
        var nonActivePlayer = match.Players.Single(player => player.PlayerId != match.ActivePlayerId);

        var act = () => _engine.ApplySpin(match, nonActivePlayer.PlayerId, 100);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*turn*");
    }

    [Fact]
    public void ApplyGuess_ShouldThrow_WhenWheelHasNotBeenSpun()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "galaxy");

        var act = () => _engine.ApplyGuess(match, match.ActivePlayerId!, "galaxy");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*spin the wheel*");
    }

    [Fact]
    public void RotateTurn_ShouldSwitchPlayerAndResetTurnState()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "thunder");
        var firstActive = match.ActivePlayerId;
        _engine.ApplySpin(match, firstActive!, 500);
        match.SecondsLeft = 0;

        _engine.RotateTurn(match);

        match.ActivePlayerId.Should().NotBe(firstActive);
        match.CurrentWheelValue.Should().BeNull();
        match.SecondsLeft.Should().Be(45);
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
