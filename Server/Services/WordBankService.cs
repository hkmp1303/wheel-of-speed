namespace WheelOfSpeed.Services;

public interface IWordBankService
{
    string GetRandomWord(List<string> usedWords);
    int GetRandomWheelValue();
}

public sealed class WordBankService : IWordBankService
{
    private static readonly string[] Words =
    [
        "socket",
        "velocity",
        "galaxy",
        "reactor",
        "network",
        "thunder",
        "diamond",
        "lantern"
    ];

    private static readonly int[] WheelValues = [100, 200, 300, 400, 500];

    public string GetRandomWord(List<string> usedWords)
    {
        // If we've used all words, reset the used list for a new cycle
        if (usedWords.Count >= Words.Length)
        {
            usedWords.Clear();
        }

        // Get available words (not yet used in this cycle)
        var availableWords = Words.Where(w => !usedWords.Contains(w)).ToArray();

        // Select random word from available pool
        var word = availableWords[Random.Shared.Next(availableWords.Length)];

        // Track this word as used
        usedWords.Add(word);

        return word;
    }

    public int GetRandomWheelValue() => WheelValues[Random.Shared.Next(WheelValues.Length)];
}
