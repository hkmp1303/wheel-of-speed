using WheelOfSpeed.Models;
using WheelOfSpeed.Services;
using FluentAssertions;
using Xunit;

namespace WheelOfSpeed.UnitTests;

public class WordBankServiceTests
{
    private readonly WordBankService _service = new();

    [Fact]
    public void GetRandomWord_Easy_ShouldReturnNonEmptyString()
    {
        var word = _service.GetRandomWord(Difficulty.Easy);
        word.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void GetRandomWord_Easy_ShouldReturnFourLetterWord()
    {
        var word = _service.GetRandomWord(Difficulty.Easy);
        word.Should().HaveLength(4);
    }

    [Fact]
    public void GetRandomWord_Easy_ShouldReturnVariedWords()
    {
        var results = Enumerable.Range(0, 50)
            .Select(_ => _service.GetRandomWord(Difficulty.Easy))
            .Distinct()
            .ToList();
        results.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void GetRandomWord_Normal_ShouldReturnNonEmptyString()
    {
        var word = _service.GetRandomWord(Difficulty.Normal);
        word.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void GetRandomWord_Normal_ShouldReturnSixLetterWord()
    {
        var word = _service.GetRandomWord(Difficulty.Normal);
        word.Should().HaveLength(6);
    }

    [Fact]
    public void GetRandomWord_Normal_ShouldReturnVariedWords()
    {
        var results = Enumerable.Range(0, 50)
            .Select(_ => _service.GetRandomWord(Difficulty.Normal))
            .Distinct()
            .ToList();
        results.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void GetRandomWord_Hard_ShouldReturnNonEmptyString()
    {
        var word = _service.GetRandomWord(Difficulty.Hard);
        word.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void GetRandomWord_Hard_ShouldReturnEightLetterWord()
    {
        var word = _service.GetRandomWord(Difficulty.Hard);
        word.Should().HaveLength(8);
    }

    [Fact]
    public void GetRandomWord_Hard_ShouldReturnVariedWords()
    {
        var results = Enumerable.Range(0, 50)
            .Select(_ => _service.GetRandomWord(Difficulty.Hard))
            .Distinct()
            .ToList();
        results.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void GetRandomWord_Default_ShouldReturnNormalWord()
    {
        var word = _service.GetRandomWord();
        word.Should().HaveLength(6);
    }

    [Fact]
    public void GetRandomWheelValue_ShouldReturnValidValue()
    {
        var validValues = new[] { 100, 200, 300, 400, 500 };
        var value = _service.GetRandomWheelValue();
        validValues.Should().Contain(value);
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