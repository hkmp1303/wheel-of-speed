using System.Collections.Concurrent;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using WheelOfSpeed.Hubs;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class InMemoryMatchServiceRematchTests
{
    [Fact]
    public async Task RequestRematchAsync_ShouldCreateRematchAndEmitChallengeEvent()
    {
        var (service, proxyMock) = BuildService();

        var original = await service.CreateMatchAsync("Alice");
        var afterJoin = await service.JoinMatchAsync(original.GuidCode, "Bob");
        MarkMatchAsFinished(service, original.GuidCode);

        var challengerId = afterJoin.Players.First(p => p.Name == "Alice").PlayerId;

        var result = await service.RequestRematchAsync(original.GuidCode, challengerId);

        result.OriginalGuidCode.Should().Be(original.GuidCode);
        result.RematchGuidCode.Should().NotBeNullOrWhiteSpace();

        var rematch = await service.GetMatchAsync(result.RematchGuidCode);
        rematch.Status.Should().Be(MatchStatus.Lobby);
        rematch.Players.Should().ContainSingle(p => p.Name == "Alice");

        proxyMock.Verify(
            p => p.SendCoreAsync(
                "rematchChallenged",
                It.Is<object?[]>(args => args.Length == 1),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcceptRematchAsync_ShouldJoinResponderAndClearPendingRematch()
    {
        var (service, _) = BuildService();

        var original = await service.CreateMatchAsync("Alice");
        var afterJoin = await service.JoinMatchAsync(original.GuidCode, "Bob");
        MarkMatchAsFinished(service, original.GuidCode);

        var challengerId = afterJoin.Players.First(p => p.Name == "Alice").PlayerId;
        var responderId = afterJoin.Players.First(p => p.Name == "Bob").PlayerId;

        var challenge = await service.RequestRematchAsync(original.GuidCode, challengerId);
        var accepted = await service.AcceptRematchAsync(original.GuidCode, responderId);

        accepted.RematchGuidCode.Should().Be(challenge.RematchGuidCode);

        var rematch = await service.GetMatchAsync(challenge.RematchGuidCode);
        rematch.Status.Should().Be(MatchStatus.Lobby);
        rematch.Players.Should().HaveCount(2);
        rematch.Players.Should().Contain(p => p.Name == "Alice");
        rematch.Players.Should().Contain(p => p.Name == "Bob");
        rematch.Players.Should().OnlyContain(p => p.IsReady == false);

        var originalState = GetMatchState(service, original.GuidCode);
        originalState.PendingRematchId.Should().BeNull();
    }

    [Fact]
    public async Task DeclineRematchAsync_ShouldRemovePendingRematchFromMemory()
    {
        var (service, _) = BuildService();

        var original = await service.CreateMatchAsync("Alice");
        var afterJoin = await service.JoinMatchAsync(original.GuidCode, "Bob");
        MarkMatchAsFinished(service, original.GuidCode);

        var challengerId = afterJoin.Players.First(p => p.Name == "Alice").PlayerId;
        var responderId = afterJoin.Players.First(p => p.Name == "Bob").PlayerId;

        var challenge = await service.RequestRematchAsync(original.GuidCode, challengerId);

        await service.DeclineRematchAsync(original.GuidCode, responderId);

        var originalState = GetMatchState(service, original.GuidCode);
        originalState.PendingRematchId.Should().BeNull();

        var loadRematch = async () => await service.GetMatchAsync(challenge.RematchGuidCode);
        await loadRematch.Should().ThrowAsync<KeyNotFoundException>();
    }

    private static (InMemoryMatchService Service, Mock<IClientProxy> ProxyMock) BuildService()
    {
        var proxyMock = new Mock<IClientProxy>();
        proxyMock
            .Setup(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var clientsMock = new Mock<IHubClients>();
        clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(proxyMock.Object);

        var hubContextMock = new Mock<IHubContext<MatchHub>>();
        hubContextMock.Setup(h => h.Clients).Returns(clientsMock.Object);

        var service = new InMemoryMatchService(new MatchEngine(), new WordBankService(), hubContextMock.Object);
        return (service, proxyMock);
    }

    private static void MarkMatchAsFinished(InMemoryMatchService service, string guidCode)
    {
        var state = GetMatchState(service, guidCode);
        state.Status = MatchStatus.Finished;
    }

    private static MatchState GetMatchState(InMemoryMatchService service, string guidCode)
    {
        var matchesField = typeof(InMemoryMatchService)
            .GetField("_matches", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        matchesField.Should().NotBeNull();

        var matches = matchesField!.GetValue(service) as ConcurrentDictionary<string, MatchState>;
        matches.Should().NotBeNull();

        var found = matches!.TryGetValue(guidCode.ToUpperInvariant(), out var state);
        found.Should().BeTrue();
        state.Should().NotBeNull();
        return state!;
    }
}
