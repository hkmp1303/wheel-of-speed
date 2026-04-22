using FluentAssertions;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class MatchEngineRematchTests
{
    private readonly MatchEngine _engine = new();

    // Builds a fully finished two-player match for use in rematch tests.
    private MatchState BuildFinishedMatch()
    {
        var match = _engine.CreateMatch("Alice");
        _engine.AddPlayer(match, "Bob");
        _engine.MarkReady(match, match.Players[0].PlayerId);
        _engine.MarkReady(match, match.Players[1].PlayerId);
        _engine.StartNextRound(match, "socket");
        _engine.FinishMatch(match, "Game over");
        return match;
    }

    // ──────────────────────────────────────────────
    // CreateRematch guard checks
    // ──────────────────────────────────────────────

    [Fact]
    public void CreateRematch_ShouldThrow_WhenMatchIsNotFinished()
    {
        var match = _engine.CreateMatch("Alice");
        _engine.AddPlayer(match, "Bob");
        // Status is Lobby, not Finished.

        var action = () => _engine.CreateRematch(match, "Alice");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*finished*");
    }

    [Fact]
    public void CreateRematch_ShouldThrow_WhenRematchAlreadyPending()
    {
        var original = BuildFinishedMatch();
        _engine.CreateRematch(original, "Alice");

        // Alice tries to create a second rematch while one is already pending.
        var action = () => _engine.CreateRematch(original, "Alice");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*pending*");
    }

    // ──────────────────────────────────────────────
    // CreateRematch happy path
    // ──────────────────────────────────────────────

    [Fact]
    public void CreateRematch_ShouldCreateNewMatchWithSameDifficulty()
    {
        var original = BuildFinishedMatch();
        original.Difficulty = Difficulty.Hard;

        var rematch = _engine.CreateRematch(original, "Alice");

        rematch.Difficulty.Should().Be(Difficulty.Hard);
    }

    [Fact]
    public void CreateRematch_ShouldCreateNewMatchWithSameMaxRounds()
    {
        var original = BuildFinishedMatch();
        original.MaxRounds = 5;

        var rematch = _engine.CreateRematch(original, "Alice");

        rematch.MaxRounds.Should().Be(5);
    }

    [Fact]
    public void CreateRematch_ShouldCreateNewMatchInLobbyStatus()
    {
        var original = BuildFinishedMatch();

        var rematch = _engine.CreateRematch(original, "Alice");

        rematch.Status.Should().Be(MatchStatus.Lobby);
    }

    [Fact]
    public void CreateRematch_ShouldPlaceChallengerAsOnlyPlayerInNewMatch()
    {
        var original = BuildFinishedMatch();

        var rematch = _engine.CreateRematch(original, "Alice");

        rematch.Players.Should().HaveCount(1);
        rematch.Players[0].Name.Should().Be("Alice");
    }

    [Fact]
    public void CreateRematch_ShouldMarkChallengerAsNotReady()
    {
        var original = BuildFinishedMatch();

        var rematch = _engine.CreateRematch(original, "Alice");

        rematch.Players[0].IsReady.Should().BeFalse();
    }

    [Fact]
    public void CreateRematch_ShouldSetPendingRematchIdOnOriginalMatch()
    {
        var original = BuildFinishedMatch();

        var rematch = _engine.CreateRematch(original, "Alice");

        original.PendingRematchId.Should().Be(rematch.MatchId);
    }

    [Fact]
    public void CreateRematch_ShouldGiveNewMatchAFreshGuidCode()
    {
        var original = BuildFinishedMatch();

        var rematch = _engine.CreateRematch(original, "Alice");

        rematch.GuidCode.Should().NotBeNullOrEmpty();
        rematch.GuidCode.Should().NotBe(original.GuidCode);
    }

    // ──────────────────────────────────────────────
    // Accept rematch (opponent joins new match)
    // Accept is modelled as AddPlayer on the rematch match,
    // matching the same create-join pattern as an ordinary lobby.
    // ──────────────────────────────────────────────

    [Fact]
    public void AcceptRematch_ShouldAddOpponentToNewMatch()
    {
        var original = BuildFinishedMatch();
        var rematch = _engine.CreateRematch(original, "Alice");

        _engine.AddPlayer(rematch, "Bob");

        rematch.Players.Should().HaveCount(2);
        rematch.Players[1].Name.Should().Be("Bob");
    }

    [Fact]
    public void AcceptRematch_ShouldLeaveNewMatchInLobbyStatus()
    {
        var original = BuildFinishedMatch();
        var rematch = _engine.CreateRematch(original, "Alice");

        _engine.AddPlayer(rematch, "Bob");

        rematch.Status.Should().Be(MatchStatus.Lobby);
    }

    [Fact]
    public void AcceptRematch_ShouldMarkNeitherPlayerAsReady()
    {
        var original = BuildFinishedMatch();
        var rematch = _engine.CreateRematch(original, "Alice");

        _engine.AddPlayer(rematch, "Bob");

        rematch.Players.Should().AllSatisfy(player => player.IsReady.Should().BeFalse());
    }

    // ──────────────────────────────────────────────
    // Decline rematch
    // ──────────────────────────────────────────────

    [Fact]
    public void DeclineRematch_ShouldClearPendingRematchIdOnOriginalMatch()
    {
        var original = BuildFinishedMatch();
        _engine.CreateRematch(original, "Alice");

        _engine.DeclineRematch(original);

        original.PendingRematchId.Should().BeNull();
    }

    [Fact]
    public void DeclineRematch_ShouldLeaveOriginalMatchAsFinished()
    {
        var original = BuildFinishedMatch();
        _engine.CreateRematch(original, "Alice");

        _engine.DeclineRematch(original);

        original.Status.Should().Be(MatchStatus.Finished);
    }
}
