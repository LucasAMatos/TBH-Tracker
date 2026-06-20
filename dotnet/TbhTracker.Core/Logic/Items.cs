using System.Globalization;

namespace TbhTracker.Core.Logic;

// Port de src/shared/items.ts (catalogo cru vem de itemData.json).

public sealed class GradeMeta
{
    public string Id { get; init; } = "";
    public string NamePt { get; init; } = "";
    public int Tier { get; init; }
    public bool Marketable { get; init; }
    public string Color { get; init; } = "";
}

public sealed class GearTypeMeta
{
    public string Id { get; init; } = "";
    public string NamePt { get; init; } = "";
    public string Category { get; init; } = "";
}

public sealed class ItemInfo
{
    public int Key { get; init; }
    public string Type { get; init; } = "";
    public string? GearType { get; init; }
    public string? Category { get; init; }
    public string? Grade { get; init; }
    public int GradeTier { get; init; }
    public int? Level { get; init; }
    public bool Marketable { get; init; }
}

public static class Items
{
    public static readonly Dictionary<string, string> CategoryLabels = new()
    {
        ["weapon"] = "Armas",
        ["offhand"] = "Mão secundária",
        ["armor"] = "Armadura",
        ["accessory"] = "Acessórios"
    };

    private static readonly Dictionary<string, (string NamePt, string Color)> GradeMetaMap = new()
    {
        ["COMMON"] = ("Comum", "#9aa4b2"),
        ["UNCOMMON"] = ("Incomum", "#4ade80"),
        ["RARE"] = ("Raro", "#38bdf8"),
        ["LEGENDARY"] = ("Lendário", "#f59e0b"),
        ["IMMORTAL"] = ("Imortal", "#ef4444"),
        ["ARCANA"] = ("Arcano", "#a855f7"),
        ["BEYOND"] = ("Além", "#ec4899"),
        ["CELESTIAL"] = ("Celestial", "#22d3ee"),
        ["DIVINE"] = ("Divino", "#eab308"),
        ["COSMIC"] = ("Cósmico", "#fb7185")
    };

    private static readonly Dictionary<string, (string NamePt, string Category)> GearTypeMetaMap = new()
    {
        ["SWORD"] = ("Espada", "weapon"),
        ["AXE"] = ("Machado", "weapon"),
        ["HATCHET"] = ("Machadinha", "weapon"),
        ["BOW"] = ("Arco", "weapon"),
        ["CROSSBOW"] = ("Besta", "weapon"),
        ["STAFF"] = ("Cajado", "weapon"),
        ["SCEPTER"] = ("Cetro", "weapon"),
        ["SHIELD"] = ("Escudo", "offhand"),
        ["ARROW"] = ("Flecha", "offhand"),
        ["BOLT"] = ("Virote", "offhand"),
        ["ORB"] = ("Orbe", "offhand"),
        ["TOME"] = ("Tomo", "offhand"),
        ["HELMET"] = ("Elmo", "armor"),
        ["ARMOR"] = ("Armadura", "armor"),
        ["GLOVES"] = ("Luvas", "armor"),
        ["BOOTS"] = ("Botas", "armor"),
        ["AMULET"] = ("Amuleto", "accessory"),
        ["EARING"] = ("Brinco", "accessory"),
        ["RING"] = ("Anel", "accessory"),
        ["BRACER"] = ("Bracelete", "accessory")
    };

    private static readonly string[] CategoryOrder = { "weapon", "offhand", "armor", "accessory" };
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    public static int MarketableTier => Catalog.Items.GradeIds.IndexOf("LEGENDARY");

    private static List<GradeMeta>? _grades;
    public static IReadOnlyList<GradeMeta> Grades => _grades ??= BuildGrades();

    private static List<GradeMeta> BuildGrades()
    {
        var ids = Catalog.Items.GradeIds;
        var marketableTier = MarketableTier;
        var list = new List<GradeMeta>();
        for (var tier = 0; tier < ids.Count; tier++)
        {
            var id = ids[tier];
            var meta = GradeMetaMap.TryGetValue(id, out var m) ? m : (id, "#9aa4b2");
            list.Add(new GradeMeta
            {
                Id = id,
                NamePt = meta.Item1,
                Tier = tier,
                Marketable = tier >= marketableTier,
                Color = meta.Item2
            });
        }
        return list;
    }

    private static List<GearTypeMeta>? _gearTypes;
    public static IReadOnlyList<GearTypeMeta> GearTypes => _gearTypes ??= BuildGearTypes();

    private static List<GearTypeMeta> BuildGearTypes()
    {
        return Catalog.Items.GearTypeIds
            .Select(id =>
            {
                var meta = GearTypeMetaMap.TryGetValue(id, out var m) ? m : (id, "accessory");
                return new GearTypeMeta { Id = id, NamePt = meta.Item1, Category = meta.Item2 };
            })
            .OrderBy(g => Array.IndexOf(CategoryOrder, g.Category))
            .ThenBy(g => g.NamePt, StringComparer.Create(PtBr, false))
            .ToList();
    }

    public static GradeMeta? GradeByTier(int tier) =>
        tier >= 0 && tier < Grades.Count ? Grades[tier] : null;

    public static GradeMeta? GradeMetaById(string id) =>
        Grades.FirstOrDefault(g => g.Id == id);

    public static ItemInfo? ClassifyItem(string key)
    {
        if (!Catalog.Items.Items.TryGetValue(key, out var datum)) return null;
        var typeIdx = datum[0];
        var gtIdx = datum[1];
        var gradeIdx = datum[2];
        var level = datum[3];

        if (typeIdx < 0 || typeIdx >= Catalog.Items.ItemTypeIds.Count) return null;
        var type = Catalog.Items.ItemTypeIds[typeIdx];

        string? gearType = gtIdx >= 0 && gtIdx < Catalog.Items.GearTypeIds.Count
            ? Catalog.Items.GearTypeIds[gtIdx]
            : null;
        var grade = GradeByTier(gradeIdx);
        string? category = gearType != null && GearTypeMetaMap.TryGetValue(gearType, out var gm)
            ? gm.Category
            : null;

        int.TryParse(key, out var keyNum);
        return new ItemInfo
        {
            Key = keyNum,
            Type = type,
            GearType = gearType,
            Category = category,
            Grade = grade?.Id,
            GradeTier = gradeIdx,
            Level = level >= 0 ? level : null,
            Marketable = gradeIdx >= MarketableTier
        };
    }
}
