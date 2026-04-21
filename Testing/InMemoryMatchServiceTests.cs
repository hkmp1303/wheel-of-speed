using Xunit;
using WheelOfSpeed.Server.Services;
using WheelOfSpeed.Server.Models;

namespace WheelOfSpeed.Tests;

public class InMemoryMatchServiceTests
{
    [Fact]
    public void CreateMatch_GeneratesGuid_AndAddsCreator()
    {
        
        var service = new InMemoryMatchService();

        
        var matchId = service.CreateMatch("Alice");
        var match = service.GetMatch(matchId);

        
        Assert.NotEqual(Guid.Empty, matchId); 
        Assert.NotNull(match);
        Assert.Single(match.Players);
        Assert.Equal("Alice", match.Players[0].Name);
    }
}