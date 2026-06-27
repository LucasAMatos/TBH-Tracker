namespace TbhTracker.Core.Logic;

// Soul Stones (ingressos dos bosses de Ato): 4 tipos, um por dificuldade.
// Chaves de item confirmadas pelos drops dos estágios X-10 (pedia/map.json):
//   190001 Normal (IMMORTAL) · 190002 Nightmare (ARCANA) ·
//   190003 Hell (BEYOND) · 190004 Torment (CELESTIAL).
// Cada soul stone é uma instância em itemSaveDatas (sem campo Quantity); contagem = nº de instâncias.

public sealed class SoulStoneType
{
    public string Kind { get; init; } = "";
    public int ItemKey { get; init; }
    public string Label { get; init; } = "";
    public string Color { get; init; } = "";
}

public static class SoulStones
{
    public const string Normal = "normal";
    public const string Nightmare = "nightmare";
    public const string Hell = "hell";
    public const string Torment = "torment";

    // Ordem por dificuldade (== ordem de exibição no Dashboard).
    public static readonly IReadOnlyList<SoulStoneType> Types = new[]
    {
        new SoulStoneType { Kind = Normal,    ItemKey = 190001, Label = "Normal",    Color = "#c9d1d9" },
        new SoulStoneType { Kind = Nightmare, ItemKey = 190002, Label = "Nightmare", Color = "#a371f7" },
        new SoulStoneType { Kind = Hell,      ItemKey = 190003, Label = "Hell",      Color = "#f85149" },
        new SoulStoneType { Kind = Torment,   ItemKey = 190004, Label = "Torment",   Color = "#f0b429" }
    };

    private static readonly Dictionary<int, string> KindByKey =
        Types.ToDictionary(t => t.ItemKey, t => t.Kind);

    public static string? KindFromItemKey(int key) =>
        KindByKey.TryGetValue(key, out var kind) ? kind : null;
}
