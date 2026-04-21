using FluentAssertions;
using WheelOfSpeed;           
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests; 

public class MatchEngineTests
{
    private readonly MatchEngine _engine = new();

    [Fact]
    public void CreateMatch_SetsInitialStateCorrectly()
    {
        
        var match = _engine.CreateMatch("Alice");

        
        Assert.NotNull(match.GuidCode);
        Assert.Equal(MatchStatus.Lobby, match.Status);
        Assert.Single(match.Players);
        Assert.Equal("Alice", match.Players[0].Name);
    }

[Fact]
    public void AddPlayer_WhenGameAlreadyStarted_DoesNotAddPlayer()
    {
        
        var match = _engine.CreateMatch("Alice");
        match.Status = MatchStatus.InProgress; 


        var act = () => _engine.AddPlayer(match, "Bob");

        
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void MarkReady_WhenAllPlayersReady_TransitionsStatusToInProgress()
    {
        
        var match = _engine.CreateMatch("Alice");
        _engine.AddPlayer(match, "Bob");

        
        _engine.MarkReady(match, match.Players[0].PlayerId); 
        
        
        Assert.Equal(MatchStatus.Lobby, match.Status); 

        
        _engine.MarkReady(match, match.Players[1].PlayerId); 

        
        Assert.True(match.Players[0].IsReady);
        Assert.True(match.Players[1].IsReady);
    }

    [Fact]
    public void FinishMatch_ShouldChangeStatusToFinished_AndSetMessage()
    {
        
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "finalword");

        
        _engine.FinishMatch(match, "Player A wins the game!");

        
        match.Status.Should().Be(MatchStatus.Finished);
        match.SecondsLeft.Should().Be(0);
        match.CurrentWheelValue.Should().BeNull();
        match.LastMessage.Should().Be("Player A wins the game!");
    }

    [Fact]
    public void RotateTurn_ShouldThrow_WhenRoundIsAlreadyResolved()
    {
        
        var match = BuildReadyMatch();
        _engine.StartNextRound(match, "timer");
        _engine.ApplySpin(match, match.ActivePlayerId!, 100);
        
        
        _engine.ApplyGuess(match, match.ActivePlayerId!, "timer");

        
        var act = () => _engine.RotateTurn(match);

        
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*resolved*");
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