using FluentAssertions;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class MatchEngineSpinTests
{
    // Valid wheel values that match the frontend prize wheel segments
    private static readonly int[] FrontendWheelValues = { 50, 100, 200, 300, 500, 1000 };

    [Fact]
    public void GenerateSpinReward_ReturnsValueFromWheel()
    {
        var engine = new MatchEngine();

        // Deterministic seed to exercise method
        var reward = engine.GenerateSpinReward(seed: 12345);

        // Must match frontend values exactly
        reward.Should().BeOneOf(FrontendWheelValues);
    }

    [Fact]
    public void GenerateSpinReward_ReturnsVariedValues()
    {
        var engine = new MatchEngine();
        var results = new System.Collections.Generic.HashSet<int>();

        // Generate 50 random values
        for (int i = 0; i < 50; i++)
        {
            var reward = engine.GenerateSpinReward();
            results.Add(reward);
        }

        // Should get variety, not stuck on one value
        results.Should().HaveCountGreaterThan(1);
        // All results should be valid frontend values
        results.Should().AllSatisfy(v => v.Should().BeOneOf(FrontendWheelValues));
    }

    [Fact]
    public void GenerateSpinReward_NeverReturnsInvalidValues()
    {
        var engine = new MatchEngine();
        // Values that are NOT on the frontend wheel
        var invalidValues = new[] { 150, 250, 350, 400, 600, 750 };

        // Generate many spins and verify none produce off-wheel values
        for (int i = 0; i < 100; i++)
        {
            var reward = engine.GenerateSpinReward();
            invalidValues.Should().NotContain(reward);
            reward.Should().BeOneOf(FrontendWheelValues);
        }
    }

    [Fact]
    public void ApplySpin_SetsCurrentWheelValueToValidValue()
    {
        var engine = new MatchEngine();
        var match = engine.CreateMatch("Test", Difficulty.Normal);
        engine.AddPlayer(match, "Player2");
        engine.MarkReady(match, match.Players[0].PlayerId);
        engine.MarkReady(match, match.Players[1].PlayerId);
        engine.StartNextRound(match, "example");

        var wheelValue = 300;
        engine.ApplySpin(match, match.ActivePlayerId!, wheelValue);

        match.CurrentWheelValue.Should().Be(wheelValue);
        match.CurrentWheelValue.Should().BeOneOf(FrontendWheelValues);
    }
}