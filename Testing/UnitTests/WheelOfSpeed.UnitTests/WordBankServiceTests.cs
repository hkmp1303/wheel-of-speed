using FluentAssertions;
using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class WordBankServiceTests
{
    private readonly WordBankService _service = new();


    [Fact]
    public void GetRandomWord_Easy_ShouldReturnNonEmptyString()
    {
        var usedWords = new List<string>();
        var word = _service.GetRandomWord(usedWords, Difficulty.Easy);
        word.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void GetRandomWord_Easy_ShouldReturnFourLetterWord()
    {
        var usedWords = new List<string>();
        var word = _service.GetRandomWord(usedWords, Difficulty.Easy);
        word.Should().HaveLength(4);
    }

    [Fact]
    public void GetRandomWord_Easy_ShouldReturnVariedWords()
    {
        var usedWords = new List<string>();
        var results = Enumerable.Range(0, 50)
            .Select(_ => _service.GetRandomWord(usedWords, Difficulty.Easy))
            .Distinct()
            .ToList();
        results.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void GetRandomWord_Normal_ShouldReturnNonEmptyString()
    {
        var usedWords = new List<string>();
        var word = _service.GetRandomWord(usedWords, Difficulty.Normal);
        word.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void GetRandomWord_Normal_ShouldReturnSixLetterWord()
    {
        var usedWords = new List<string>();
        var word = _service.GetRandomWord(usedWords, Difficulty.Normal);
        word.Should().HaveLength(6);
    }

    [Fact]
    public void GetRandomWord_Normal_ShouldReturnVariedWords()
    {
        var usedWords = new List<string>();
        var results = Enumerable.Range(0, 50)
            .Select(_ => _service.GetRandomWord(usedWords, Difficulty.Normal))
            .Distinct()
            .ToList();
        results.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void GetRandomWord_Hard_ShouldReturnNonEmptyString()
    {
        var usedWords = new List<string>();
        var word = _service.GetRandomWord(usedWords, Difficulty.Hard);
        word.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void GetRandomWord_Hard_ShouldReturnEightLetterWord()
    {
        var usedWords = new List<string>();
        var word = _service.GetRandomWord(usedWords, Difficulty.Hard);
        word.Should().HaveLength(8);
    }

    [Fact]
    public void GetRandomWord_Hard_ShouldReturnVariedWords()
    {
        var usedWords = new List<string>();
        var results = Enumerable.Range(0, 50)
            .Select(_ => _service.GetRandomWord(usedWords, Difficulty.Hard))
            .Distinct()
            .ToList();
        results.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void GetRandomWord_Default_ShouldReturnNormalWord()
    {
        var usedWords = new List<string>();
        var word = _service.GetRandomWord(usedWords);
        word.Should().HaveLength(6);
    }

    [Fact]
    public void GetRandomWheelValue_ShouldReturnValidValue()
    {
        var service = new WordBankService();
        var validValues = new[] { 100, 200, 300, 400, 500 };
        // test 20 random wheel values
        for (int i = 0; i < 20; i++)
        {
            var value = service.GetRandomWheelValue();
            validValues.Should().Contain(value);
        }
    }

    [Fact]
    public void GetRandomWheelValue_ShouldReturnVariedValues()
    {
        var results = Enumerable.Range(0, 50)
            .Select(_ => _service.GetRandomWheelValue())
            .Distinct()
            .ToList();
        results.Should().HaveCountGreaterThan(1);
    }
}
