namespace WheelOfSpeed.Services;

public interface IWordBankService
{
    string GetRandomWord();
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

    public string GetRandomWord() => Words[Random.Shared.Next(Words.Length)];

    public int GetRandomWheelValue() => WheelValues[Random.Shared.Next(WheelValues.Length)];
}
