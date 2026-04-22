using Xunit;
using FluentAssertions;
using WheelOfSpeed.Services;

namespace WheelOfSpeed.UnitTests
{
    /// <summary>
    /// Tests for wheel spin functionality and reward generation.
    ///
    /// IMPORTANT: Frontend and Backend must use the same wheel values!
    /// Frontend VALUES array (PrizeWheel.jsx): [100, 200, 300, 400, 500]
    /// Backend must match this exactly.
    /// </summary>
    public class MatchEngineSpinTests
    {
        // Frontend wheel values - MUST match PrizeWheel.jsx VALUES array
        private static readonly int[] FRONTEND_WHEEL_VALUES = { 100, 200, 300, 400, 500 };

        [Fact]
        public void GenerateSpinReward_ReturnsValueFromFrontendWheelArray()
        {
            var engine = new MatchEngine();

            // deterministic seed to exercise method
            var reward = engine.GenerateSpinReward(seed: 12345);

            // Must match frontend values exactly
            reward.Should().BeOneOf(FRONTEND_WHEEL_VALUES);
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
            results.Should().AllSatisfy(v => v.Should().BeOneOf(FRONTEND_WHEEL_VALUES));
        }

        [Fact]
        public void GenerateSpinReward_NeverReturnsInvalidValues()
        {
            var engine = new MatchEngine();
            var invalidValues = new[] { 50, 150, 250, 600, 1000 };

            // Generate many spins
            for (int i = 0; i < 100; i++)
            {
                var reward = engine.GenerateSpinReward();
                reward.Should().NotBeOneOf(invalidValues);
                reward.Should().BeOneOf(FRONTEND_WHEEL_VALUES);
            }
        }

        [Fact]
        public void ApplySpin_SetsCurrentWheelValueToValidValue()
        {
            var engine = new MatchEngine();
            var match = new System.Func<MatchState>(() =>
            {
                var m = engine.CreateMatch("Test");
                engine.AddPlayer(m, "Player2");
                engine.MarkReady(m, m.Players[0].PlayerId);
                engine.MarkReady(m, m.Players[1].PlayerId);
                return m;
            })();

            var wheelValue = 300;
            engine.ApplySpin(match, match.ActivePlayerId!, wheelValue);

            match.CurrentWheelValue.Should().Be(wheelValue);
            match.CurrentWheelValue.Should().BeOneOf(FRONTEND_WHEEL_VALUES);
        }
    }
}