using FluentAssertions;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class WordBankServiceTests
{
    [Fact]
    public void GetRandomWord_ShouldNotRepeatUntilAllWordsUsed()
    {
        var service = new WordBankService();
        var usedWords = new List<string>();
        var uniqueWords = new HashSet<string>();

        // Get 8 words (the entire pool)
        for (int i = 0; i < 8; i++)
        {
            var word = service.GetRandomWord(usedWords);
            uniqueWords.Should().NotContain(word, "word should not repeat until all 8 words are used");
            uniqueWords.Add(word);
        }

        // Should have gotten all 8 unique words
        uniqueWords.Count.Should().Be(8);
        usedWords.Count.Should().Be(8);

        // 9th word should start a new cycle (usedWords gets cleared)
        var ninthWord = service.GetRandomWord(usedWords);
        ninthWord.Should().NotBeNullOrEmpty();
        usedWords.Count.Should().Be(1, "usedWords list should have been cleared and restarted");

        // Continue for another 7 words to complete second cycle
        uniqueWords.Clear();
        for (int i = 0; i < 7; i++)
        {
            var word = service.GetRandomWord(usedWords);
            uniqueWords.Should().NotContain(word, "word should not repeat in second cycle");
            uniqueWords.Add(word);
        }

        usedWords.Count.Should().Be(8);
    }

    [Fact]
    public void GetRandomWord_ShouldReturnDifferentWordsOverTime()
    {
        var service = new WordBankService();
        var usedWords = new List<string>();
        var allWords = new HashSet<string>();

        // Collect 50 words
        for (int i = 0; i < 50; i++)
        {
            allWords.Add(service.GetRandomWord(usedWords));
        }

        // Should have gotten all 8 different words across 50 attempts
        allWords.Count.Should().Be(8);
    }

    [Fact]
    public void GetRandomWheelValue_ShouldReturnValidValue()
    {
        var service = new WordBankService();
        var validValues = new[] { 100, 200, 300, 400, 500 };

        for (int i = 0; i < 20; i++)
        {
            var value = service.GetRandomWheelValue();
            validValues.Should().Contain(value);
        }
    }
}
