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
        // Act
        var match = _engine.CreateMatch("Alice");

        // Assert
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
}