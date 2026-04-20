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
    public void StartNextRound_ShouldResetMessageColorToDefault()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor");
        _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        // Apply correct guess to set yellow color
        var (_, updated) = _engine.ApplyGuess(match, match.ActivePlayerId!, "reactor");
        updated.LastMessageColor.Should().Be("#ffd700");

        // End the round
        _engine.EndRound(updated, "Round finished");

        // Start next round - should reset color to null
        _engine.StartNextRound(updated, "network");

        updated.LastMessageColor.Should().BeNull();
        updated.LastMessage.Should().Contain("Round 2 started");
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
    public void ApplyGuess_ShouldSetYellowColorForCorrectAnswer()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor");
        _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        var (isCorrect, updated) = _engine.ApplyGuess(match, match.ActivePlayerId!, "reactor");

        isCorrect.Should().BeTrue();
        updated.LastMessageColor.Should().Be("#ffd700"); // Yellow color
        updated.LastMessage.Should().Contain("Correct answer");
    }

    [Fact]
    public void ApplySpin_ShouldRevealFirstLetterImmediately()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor");

        _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        match.RevealedIndexes.Should().HaveCount(1);
        match.ElapsedSecondsSinceSpin.Should().Be(0);
    }

    [Fact]
    public void EndRound_ShouldRevealAllLetters()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor");
        _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        // Only 1 letter revealed from spin
        match.RevealedIndexes.Should().HaveCount(1);

        _engine.EndRound(match, "Round ended");

        // All 7 letters should now be revealed
        match.RevealedIndexes.Should().HaveCount(7);
        match.Status.Should().Be(MatchStatus.RoundEnded);
    }

    [Fact]
    public void EndRound_ShouldSetActivePlayerForNextRound()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor"); // Round 1, player index 0
        _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        _engine.EndRound(match, "Round ended");

        // Active player should be set to whoever starts the NEXT round (round 2)
        // Round 2 should start with player index 1 (based on (2-1) % playerCount)
        match.CurrentRound.Should().Be(1); // Still round 1
        match.ActivePlayerIndex.Should().Be(1); // Next round will be started by player 1
        match.ActivePlayerId.Should().Be(match.Players[1].PlayerId);
    }

    [Fact]
    public void EndRound_ShouldClearFinalGuessFlag()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor");
        var firstActive = match.ActivePlayerId;
        _engine.ApplySpin(match, firstActive!, 500);
        match.SecondsLeft = 0;
        _engine.RotateTurn(match); // Creates final guess turn

        match.IsFinalGuess.Should().BeTrue();

        _engine.EndRound(match, "Round ended");

        // IsFinalGuess should be cleared when round ends
        match.IsFinalGuess.Should().BeFalse();
    }

    [Fact]
    public void EndRound_ShouldPreserveCorrectAnswerMessageAndColor()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "reactor");
        _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        // Apply correct guess to set the message and color
        var (_, updated) = _engine.ApplyGuess(match, match.ActivePlayerId!, "reactor");

        // Verify message and color are set
        updated.LastMessage.Should().Contain("Correct answer");
        updated.LastMessageColor.Should().Be("#ffd700");

        // Now call EndRound - it should preserve the message and color
        _engine.EndRound(updated, "Round finished");

        // Message and color should still be preserved
        updated.LastMessage.Should().Contain("Correct answer");
        updated.LastMessageColor.Should().Be("#ffd700");
    }

    [Fact]
    public void RevealAllLetters_ShouldRevealAllLettersInWord()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "thunder");

        _engine.RevealAllLetters(match);

        match.RevealedIndexes.Should().HaveCount(7);
        // Verify all indexes from 0-6 are revealed
        match.RevealedIndexes.Should().Contain(new[] { 0, 1, 2, 3, 4, 5, 6 });
    }

    [Fact]
    public void StartNextRound_ShouldCalculateTimerBasedOnWordLength()
    {
        var match = BuildReadyMatch();

        // 7-letter word "REACTOR":
        // 0s: 1st, 5s: 2nd, 10s: 3rd, 18s: 4th (+8s standard)
        // 28s: 5th (+10s, 3rd-to-last), 38s: 6th (+10s, 2nd-to-last)
        // Timer should be 38s + 10s buffer = 48s
        _engine.StartNextRound(match, "reactor");
        match.SecondsLeft.Should().Be(48);

        // 4-letter word "FIRE":
        // 0s: 1st, 5s: 2nd, 10s: 3rd (2nd-to-last)
        // Timer should be 10s + 10s buffer = 20s
        var match2 = BuildReadyMatch();
        _engine.StartNextRound(match2, "fire");
        match2.SecondsLeft.Should().Be(20);

        // 5-letter word "APPLE":
        // 0s: 1st, 5s: 2nd, 10s: 3rd, 20s: 4th (+10s, 2nd-to-last gets 10s interval)
        // Timer should be 20s + 10s buffer = 30s
        var match3 = BuildReadyMatch();
        _engine.StartNextRound(match3, "apple");
        match3.SecondsLeft.Should().Be(30);
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
    public void RotateTurn_ShouldCreateFinalGuessTurn_WhenWheelValueExists()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "thunder");
        var firstActive = match.ActivePlayerId;
        _engine.ApplySpin(match, firstActive!, 500);
        match.SecondsLeft = 0;

        _engine.RotateTurn(match);

        match.ActivePlayerId.Should().NotBe(firstActive);
        match.CurrentWheelValue.Should().Be(500); // Wheel value should be locked
        match.SecondsLeft.Should().Be(20); // Final guess gets 20 seconds
        match.IsFinalGuess.Should().BeTrue();
    }

    [Fact]
    public void RotateTurn_ShouldResetNormally_WhenNoWheelValue()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "thunder");
        var firstActive = match.ActivePlayerId;
        match.SecondsLeft = 0;

        _engine.RotateTurn(match);

        match.ActivePlayerId.Should().NotBe(firstActive);
        match.CurrentWheelValue.Should().BeNull();
        match.SecondsLeft.Should().Be(45);
        match.IsFinalGuess.Should().BeFalse();
    }

    [Fact]
    public void ApplySpin_ShouldThrow_WhenFinalGuess()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "thunder");
        var firstActive = match.ActivePlayerId;
        _engine.ApplySpin(match, firstActive!, 500);
        match.SecondsLeft = 0;
        _engine.RotateTurn(match); // This creates a final guess turn

        var act = () => _engine.ApplySpin(match, match.ActivePlayerId!, 300);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot spin the wheel during a final guess*");
    }

    [Fact]
    public void ApplyGuess_ShouldAllowMultipleGuesses_DuringFinalGuess()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "thunder");
        var firstActive = match.ActivePlayerId;
        _engine.ApplySpin(match, firstActive!, 500);
        match.SecondsLeft = 0;
        _engine.RotateTurn(match); // This creates a final guess turn

        // First incorrect guess should not end the round
        var (isCorrect1, updated1) = _engine.ApplyGuess(match, match.ActivePlayerId!, "wrong");
        isCorrect1.Should().BeFalse();
        updated1.RoundResolved.Should().BeFalse();
        updated1.LastMessage.Should().Contain("Try again");

        // Second incorrect guess should also not end the round
        var (isCorrect2, updated2) = _engine.ApplyGuess(match, match.ActivePlayerId!, "incorrect");
        isCorrect2.Should().BeFalse();
        updated2.RoundResolved.Should().BeFalse();

        // Correct guess should end the round
        var (isCorrect3, updated3) = _engine.ApplyGuess(match, match.ActivePlayerId!, "thunder");
        isCorrect3.Should().BeTrue();
        updated3.RoundResolved.Should().BeTrue();
    }

    [Fact]
    public void ApplyGuess_ShouldAwardPoints_WhenFinalGuessIsCorrect()
    {
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "thunder");
        var firstActive = match.ActivePlayerId;
        var secondActive = match.Players.Single(p => p.PlayerId != firstActive).PlayerId;
        _engine.ApplySpin(match, firstActive!, 500);
        match.SecondsLeft = 0;
        _engine.RotateTurn(match); // This creates a final guess turn for second player

        var (isCorrect, updated) = _engine.ApplyGuess(match, secondActive!, "thunder");

        isCorrect.Should().BeTrue();
        updated.RoundResolved.Should().BeTrue();
        var secondPlayer = updated.Players.Single(p => p.PlayerId == secondActive);
        secondPlayer.Score.Should().Be(500); // Should get the locked wheel value
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
