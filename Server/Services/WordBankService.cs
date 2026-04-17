namespace WheelOfSpeed.Services;

public enum Difficulty
{
    Easy,
    Normal,
    Hard
}

public interface IWordBankService
{
    string GetRandomWord(Difficulty difficulty = Difficulty.Normal);
    int GetRandomWheelValue();
}

public sealed class WordBankService : IWordBankService
{
    // Easy: 4-letter words — short and very common
    private static readonly string[] EasyWords =
    [
        "baby", "back", "ball", "band", "barn", "bear", "beat", "bike",
        "bird", "bite", "blow", "blue", "boat", "body", "bold", "bomb",
        "bond", "bone", "book", "boom", "boot", "born", "boss", "both",
        "bowl", "burn", "cage", "cake", "call", "calm", "came", "card",
        "care", "cart", "case", "cash", "cast", "cave", "chef", "chip",
        "chop", "city", "clam", "clap", "clay", "clip", "club", "coal",
        "coat", "coil", "cold", "comb", "come", "cook", "cool", "cope",
        "copy", "cord", "core", "corn", "cost", "crab", "crew", "crop",
        "dark", "dart", "data", "dawn", "deal", "dear", "deck", "deep",
        "deer", "deny", "desk", "diet", "disk", "dive", "dock", "doll",
        "dome", "door", "down", "draw", "drop", "drum", "dune", "dust",
        "duty", "each", "earn", "east", "edge", "epic", "ever", "evil",
        "face", "fact", "fail", "fake", "fall", "fame", "fast", "feat",
        "feed", "feel", "feet", "fell", "felt", "file", "fill", "film",
        "find", "fine", "fire", "fish", "flag", "flat", "flew", "flip",
        "flow", "foam", "fold", "folk", "fond", "food", "ford", "fork",
        "form", "fort", "foul", "free", "from", "fuel", "full", "fund",
        "fury", "fuse", "gain", "game", "gang", "gate", "gear", "gift",
        "give", "glad", "glow", "glue", "goal", "good", "grab", "gray",
        "grew", "grid", "grin", "grip", "grow", "gulf", "guru", "gust",
        "half", "hall", "halt", "hand", "hang", "hard", "harm", "harp",
        "hash", "hate", "have", "hawk", "heal", "heap", "heat", "heel",
        "hero", "hide", "high", "hike", "hill", "hint", "hire", "hold",
        "hole", "home", "hook", "hope", "horn", "host", "huge", "hunt",
        "hurt", "icon", "idea", "idle", "iron", "isle", "jump", "just",
        "keep", "kill", "kind", "king", "kiss", "knot", "know", "lack",
        "lake", "land", "lane", "last", "late", "lawn", "lead", "leaf",
        "lean", "leap", "left", "less", "lick", "life", "lift", "like",
        "lime", "link", "lion", "list", "live", "load", "lock", "logo",
        "lone", "look", "loop", "lord", "lose", "loss", "lost", "love",
        "luck", "made", "main", "make", "mall", "many", "mark", "mask",
        "mast", "meal", "mean", "meet", "melt", "memo", "mess", "mild",
        "milk", "mill", "mind", "mine", "mint", "miss", "mist", "moat",
        "mock", "mode", "moon", "more", "most", "move", "much", "myth",
        "nail", "name", "navy", "neck", "need", "nice", "noon", "norm",
        "note", "nova", "obey", "once", "only", "open", "oral", "oven",
        "over", "pack", "page", "paid", "pain", "pair", "pale", "palm",
        "park", "past", "path", "peak", "peel", "peer", "pick", "pike",
        "pile", "pine", "pink", "pipe", "plan", "play", "plot", "plow",
        "plug", "plus", "poem", "poet", "poke", "pole", "pond", "poor",
        "pose", "post", "pour", "prey", "prop", "pull", "pump", "pure",
        "push", "rain", "rake", "rank", "rare", "rate", "read", "real",
        "reel", "rely", "rent", "rest", "rice", "rich", "ride", "ring",
        "rise", "risk", "road", "roam", "roar", "role", "roll", "roof",
        "room", "rope", "rose", "rule", "rush", "rust", "safe", "sail",
        "sake", "salt", "sand", "sang", "seal", "seek", "self", "sell",
        "shed", "ship", "shop", "shot", "show", "shut", "side", "sift",
        "sign", "silk", "sing", "sink", "site", "skip", "slim", "slip",
        "slow", "snow", "soap", "sock", "soil", "sold", "sole", "some",
        "song", "soon", "sort", "soul", "soup", "sour", "span", "spin",
        "spot", "star", "stay", "stem", "step", "stir", "stop", "surf",
        "swim", "tail", "take", "tall", "task", "team", "tear", "tell",
        "tent", "term", "test", "tide", "till", "time", "tiny", "tire",
        "toad", "toll", "tone", "tool", "tour", "town", "trap", "tree",
        "trek", "trim", "trio", "trip", "true", "tube", "tuck", "tune",
        "turn", "twin", "type", "upon", "used", "vain", "vale", "vast",
        "vent", "very", "vest", "view", "vine", "void", "wade", "wake",
        "walk", "wall", "wand", "want", "warm", "wary", "wash", "wave",
        "weak", "weed", "well", "went", "west", "when", "whip", "wide",
        "wild", "will", "wind", "wine", "wing", "wire", "wise", "wish",
        "with", "wolf", "worm", "wrap", "yard", "year", "your", "zone",
    ];

    // Normal: 6-letter words — recognizable but require more thought
    private static readonly string[] NormalWords =
    [
        "absent", "accent", "accept", "access", "active", "actual",
        "animal", "annual", "answer", "anyone", "appear", "around",
        "author", "bamboo", "banana", "battle", "beauty", "bridge",
        "broken", "budget", "butter", "button", "camera", "castle",
        "cattle", "change", "charge", "choose", "circle", "client",
        "closed", "closet", "coffee", "combat", "coming", "common",
        "corner", "cotton", "course", "create", "crisis", "cruise",
        "custom", "damage", "danger", "decade", "decide", "defeat",
        "defend", "define", "demand", "desert", "design", "detail",
        "dining", "dinner", "dollar", "domain", "donkey", "double",
        "dragon", "drawer", "during", "either", "employ", "enable",
        "engine", "enough", "entire", "escape", "events", "fabric",
        "factor", "family", "famous", "finger", "folder", "follow",
        "forest", "formal", "foster", "frozen", "future", "garden",
        "gentle", "global", "golden", "growth", "guitar", "harbor",
        "honest", "hunter", "impact", "import", "inside", "island",
        "junior", "kitten", "launch", "lawyer", "leader", "listen",
        "little", "manage", "market", "mirror", "mobile", "modern",
        "moment", "monkey", "mother", "mutual", "narrow", "needle",
        "office", "option", "orange", "origin", "output", "palace",
        "parrot", "pencil", "pepper", "person", "pillow", "planet",
        "pocket", "police", "poster", "powder", "prefer", "pretty",
        "prince", "prison", "profit", "public", "purple", "rabbit",
        "racing", "random", "rating", "reader", "reduce", "reform",
        "region", "relate", "remain", "repair", "rescue", "ribbon",
        "riddle", "rocket", "rubber", "salmon", "sample", "school",
        "secret", "shadow", "signal", "silver", "simple", "single",
        "sister", "sketch", "spider", "spring", "stable", "statue",
        "sticky", "stream", "street", "strict", "string", "studio",
        "summer", "sunset", "switch", "symbol", "system", "tablet",
        "talent", "target", "temple", "tender", "ticket", "timber",
        "tissue", "tongue", "travel", "tunnel", "turtle", "unison",
        "valley", "velvet", "vessel", "victim", "violet", "virtue",
        "vision", "volume", "walnut", "walrus", "window", "winter",
        "wisdom", "wonder", "wooden", "worker", "yellow",
    ];

    // Hard: 8-letter words — longer and more challenging
    private static readonly string[] HardWords =
    [
        "absolute", "abstract", "accident", "accurate", "activate",
        "actually", "addition", "adhesive", "adjusted", "advanced",
        "affected", "aircraft", "birthday", "bracelet", "building",
        "business", "calendar", "campaign", "capacity", "captains",
        "cardinal", "carnival", "category", "champion", "chemical",
        "children", "circular", "climbing", "clothing", "complete",
        "compound", "computer", "conclude", "conflict", "congress",
        "consider", "constant", "contract", "contrast", "coverage",
        "creative", "criminal", "critical", "cultural", "customer",
        "database", "daughter", "deadline", "decision", "decrease",
        "definite", "delivery", "designed", "detector", "dialogue",
        "directly", "disabled", "discount", "discover", "disorder",
        "distance", "dominant", "download", "dramatic", "dynamics",
        "educated", "election", "elevator", "employed", "epidemic",
        "evaluate", "eventual", "evidence", "feedback", "festival",
        "finances", "football", "forecast", "fortress", "graduate",
        "greatest", "guardian", "guidance", "hardware", "highland",
        "historic", "hospital", "humidity", "hundreds", "identity",
        "improved", "increase", "industry", "innocent", "instance",
        "internal", "keyboard", "language", "learning", "majority",
        "marriage", "material", "maternal", "medicine", "military",
        "mountain", "movement", "national", "navigate", "negative",
        "northern", "observed", "occupied", "ordinary", "original",
        "outdoors", "overhead", "paradise", "parallel", "patience",
        "patterns", "personal", "physical", "platform", "position",
        "positive", "possible", "practice", "pregnant", "pressure",
        "previous", "probably", "property", "proposal", "prospect",
        "protocol", "province", "punctual", "purchase", "recently",
        "recovery", "religion", "remember", "response", "romantic",
        "rotation", "schedule", "security", "sentence", "software",
        "solution", "southern", "specific", "spectrum", "standard",
        "standing", "starting", "strength", "students", "survival",
        "swimming", "together", "tomorrow", "training", "transfer",
        "tropical", "twilight", "ultimate", "umbrella", "universe",
        "velocity", "vertical", "violence", "whatever", "whenever",
        "wireless", "workshop", "yourself",
    ];

    private static readonly int[] WheelValues = [100, 200, 300, 400, 500];

    public string GetRandomWord(Difficulty difficulty = Difficulty.Normal)
    {
        var words = difficulty switch
        {
            Difficulty.Easy   => EasyWords,
            Difficulty.Normal => NormalWords,
            Difficulty.Hard   => HardWords,
            _                 => NormalWords
        };

        return words[Random.Shared.Next(words.Length)];
    }

    public int GetRandomWheelValue() =>
        WheelValues[Random.Shared.Next(WheelValues.Length)];
}
