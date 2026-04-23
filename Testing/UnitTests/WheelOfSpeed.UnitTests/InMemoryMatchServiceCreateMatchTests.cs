using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using WheelOfSpeed.Hubs;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class InMemoryMatchServiceCreateMatchTests
{
    [Fact]
    public async Task CreateMatchAsync_WithValidEvenRounds_ShouldSetMaxRounds()
    {
        var service = BuildService();

        var match = await service.CreateMatchAsync("Alice", Difficulty.Normal, 8);

        match.MaxRounds.Should().Be(8);
    }

    [Theory]
    [InlineData(3)]
    [InlineData(5)]
    [InlineData(17)]
    [InlineData(0)]
    [InlineData(-2)]
    public async Task CreateMatchAsync_WithInvalidRounds_ShouldThrowInvalidOperationException(int invalidRounds)
    {
        var service = BuildService();

        var act = async () => await service.CreateMatchAsync("Alice", Difficulty.Normal, invalidRounds);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Max rounds must be an even number between 4 and 16.");
    }

    private static InMemoryMatchService BuildService()
    {
        var proxyMock = new Mock<IClientProxy>();
        proxyMock
            .Setup(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var clientsMock = new Mock<IHubClients>();
        clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(proxyMock.Object);

        var hubContextMock = new Mock<IHubContext<MatchHub>>();
        hubContextMock.Setup(h => h.Clients).Returns(clientsMock.Object);

        return new InMemoryMatchService(new MatchEngine(), new WordBankService(), hubContextMock.Object);
    }
}