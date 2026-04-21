using Xunit;
using WheelOfSpeed.Services;

namespace WheelOfSpeed.UnitTests
{
    public class MatchEngineSpinTests
    {
        [Fact]
        public void GenerateSpinReward_ReturnsValueFromWheel()
        {
            var engine = new MatchEngine();
            var allowed = new[] { 50, 100, 200, 300, 500, 1000 };

            // deterministic seed to exercise method
            var reward = engine.GenerateSpinReward(seed: 12345);

            Assert.Contains(reward, allowed);
        }
    }
}