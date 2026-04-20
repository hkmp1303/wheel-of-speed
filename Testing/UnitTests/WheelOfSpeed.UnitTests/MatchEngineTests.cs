using Xunit;
using WheelOfSpeed;
using WheelOfSpeed.Models;  

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
        // Arrange
        var match = _engine.CreateMatch("Alice");
        match.Status = MatchStatus.Playing; // Force status change

        // Act
        _engine.AddPlayer(match, "Bob");

        // Assert
        Assert.Single(match.Players); // Bob should NOT be added
    }

    [Fact]
    public void MarkReady_WhenAllPlayersReady_TransitionsStatusToPlaying()
    {
        // Arrange
        var match = _engine.CreateMatch("Alice");
        _engine.AddPlayer(match, "Bob");

        // Act
        _engine.MarkReady(match, match.Players[0].Id); // Alice is ready
        
        // Assert - Game shouldn't start with only 1 ready
        Assert.Equal(MatchStatus.Lobby, match.Status); 

        // Act - Bob is ready
        _engine.MarkReady(match, match.Players[1].Id);

        // Assert - Game should auto-start!
        Assert.Equal(MatchStatus.Playing, match.Status); // Or whatever your next status is (e.g., RoundStarted)
    }
}