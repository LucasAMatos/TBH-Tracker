using System.Text.Json.Serialization;

namespace TbhTracker.Core.Models;

// Port de src/shared/types.ts. As "string unions" do TS (status, kind, localizacao,
// categoria de runa, widget id) viram constantes/strings em C# para manter o JSON
// persistido e a comparacao na UI identicos ao original.

/// <summary>Status da conexao do tracker (ConnectionStatus do TS).</summary>
public static class ConnectionStatus
{
    public const string Monitoring = "monitoring";
    public const string NoKey = "no-key";
    public const string NoSave = "no-save";
    public const string Error = "error";
}

public sealed class StageInfo
{
    public string Raw { get; set; } = "";
    public int Difficulty { get; set; }
    public string DifficultyName { get; set; } = "";
    public int Act { get; set; }
    public int Phase { get; set; }
    public bool IsBoss { get; set; }
    public string Label { get; set; } = "";
}

public sealed class RuneLevel
{
    public int Key { get; set; }
    public int Level { get; set; }
}

public sealed class HeroAttributeLevel
{
    public int Key { get; set; }
    public int Level { get; set; }
}

public sealed class RuneTargetStep
{
    public int Key { get; set; }
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public string Category { get; set; } = "";
    public int FromLevel { get; set; }
    public int ToLevel { get; set; }
    public double GoldCost { get; set; }
    public bool PayableInGold { get; set; }
    public bool IsTarget { get; set; }
    public bool Affordable { get; set; }
}

public sealed class RuneTargetPlan
{
    public int TargetKey { get; set; }
    public string TargetName { get; set; } = "";
    public string TargetIcon { get; set; } = "";
    public string Category { get; set; } = "";
    public int CurrentLevel { get; set; }
    public int MaxLevel { get; set; }
    public bool Reachable { get; set; }
    public bool AlreadyComplete { get; set; }
    public List<RuneTargetStep> Steps { get; set; } = new();
    public double TotalGoldCost { get; set; }
    public double? GoldHave { get; set; }
    public double GoldMissing { get; set; }
    public double Progress { get; set; }
    public bool HasNonGold { get; set; }
}

public sealed class HeroSnapshot
{
    // No TS heroKey pode ser number|string; aqui normalizamos para string para chave estavel.
    public string Key { get; set; } = "";
    public string Name { get; set; } = "";
    public int? Level { get; set; }
    public double? Exp { get; set; }
    public bool Unlocked { get; set; }
    public bool Active { get; set; }
}

public sealed class GoldEvent
{
    public long At { get; set; }
    public double Delta { get; set; }
    public double Gold { get; set; }
}

public sealed class GoldFlow
{
    public long SessionStartAt { get; set; }
    public double SessionStartGold { get; set; }
    public double CurrentGold { get; set; }
    public double NetDelta { get; set; }
    public double ElapsedSeconds { get; set; }
    public double? SessionRatePerHour { get; set; }
    public double? WindowRatePerHour { get; set; }
    public double WindowSeconds { get; set; }
    public List<GoldEvent> Events { get; set; } = new();
}

public sealed class LevelUpEvent
{
    public long At { get; set; }
    public string HeroKey { get; set; } = "";
    public string HeroName { get; set; } = "";
    public int FromLevel { get; set; }
    public int ToLevel { get; set; }
}

public sealed class HeroEvents
{
    public long SessionStartAt { get; set; }
    public List<LevelUpEvent> LevelUps { get; set; } = new();
}

public static class StageEventKind
{
    public const string StageChange = "stage-change";
    public const string NewMax = "new-max";
}

public sealed class StageEvent
{
    public long At { get; set; }
    public string Kind { get; set; } = "";
    public string? FromRaw { get; set; }
    public string ToRaw { get; set; } = "";
    public string ToLabel { get; set; } = "";
}

public sealed class StageEvents
{
    public long SessionStartAt { get; set; }
    public List<StageEvent> Events { get; set; } = new();
}

public sealed class StageFarmEntry
{
    public string StageRaw { get; set; } = "";
    public double GoldGained { get; set; }
    public double ExpGained { get; set; }
    public double KillsGained { get; set; }
    public double Seconds { get; set; }
    public int Reads { get; set; }
    public double? GoldPerHour { get; set; }
    public double? ExpPerHour { get; set; }
    public double? Clears { get; set; }
    public double? ClearsPerHour { get; set; }
    public double? SecondsPerClear { get; set; }
    public double? GoldPerClear { get; set; }
    public double? ExpPerClear { get; set; }
    public long LastAt { get; set; }
}

public sealed class StageFarm
{
    public List<StageFarmEntry> Entries { get; set; } = new();
    public double TotalSeconds { get; set; }
    public string? CurrentStageRaw { get; set; }
}

public sealed class BoxCount
{
    public string Kind { get; set; } = "";
    public string Label { get; set; } = "";
    public int Quantity { get; set; }
}

/// <summary>Localizacao de uma instancia de item no save (ItemLocation do TS).</summary>
public static class ItemLocation
{
    public const string Equipped = "equipped";
    public const string Inventory = "inventory";
    public const string Stash = "stash";
    public const string Trading = "trading";
    public const string Loose = "loose";

    public static readonly string[] All = { Equipped, Inventory, Stash, Trading, Loose };

    public static readonly Dictionary<string, string> Labels = new()
    {
        [Equipped] = "Equipado",
        [Inventory] = "Inventário",
        [Stash] = "Stash",
        [Trading] = "Trade Ship",
        [Loose] = "Solto"
    };
}

public sealed class InventoryRow
{
    public string GearType { get; set; } = "";
    public string Label { get; set; } = "";
    public string Category { get; set; } = "";
    public Dictionary<string, int[]> ByLocation { get; set; } = new();
    public int[] Counts { get; set; } = Array.Empty<int>();
    public int Total { get; set; }
}

public sealed class InventorySummary
{
    public int TotalItems { get; set; }
    public int GearCount { get; set; }
    public int MaterialCount { get; set; }
    public int BoxCount { get; set; }
    public int UnknownCount { get; set; }
    public int LegendaryPlus { get; set; }
    public int GradeCount { get; set; }
    public List<InventoryRow> Rows { get; set; } = new();
    public Dictionary<string, int> LocationTotals { get; set; } = new();
}

public sealed class PetSnapshot
{
    public int Key { get; set; }
    public bool Unlocked { get; set; }
    public bool Active { get; set; }
}

// Uma linha do resumo de derretimento por raridade (D5).
public sealed class MeltRarityRow
{
    public int Tier { get; set; }
    public int Count { get; set; }
    public double Gold { get; set; }
    public double CubeXp { get; set; }
}

// Resumo do derretimento/Alchemy do inventario (D5): so gear, excluindo equipados e
// Legendary+ (vendaveis no Market). Calculado no parser a partir de meltData.json.
public sealed class MeltSummary
{
    public double TotalGold { get; set; }
    public double TotalCubeXp { get; set; }
    public int ItemCount { get; set; }
    public int ExcludedMarketable { get; set; }
    public int ExcludedEquipped { get; set; }
    public int NoData { get; set; }
    public List<MeltRarityRow> ByRarity { get; set; } = new();
}

public sealed class Snapshot
{
    public long CapturedAt { get; set; }
    public int? PlayTimeSeconds { get; set; }
    public double? Gold { get; set; }
    public double? TotalKills { get; set; }
    public StageInfo? Stage { get; set; }
    public int? CurrentWave { get; set; }
    public StageInfo? MaxCompletedStage { get; set; }
    public int? CubeLevel { get; set; }
    public double? CubeExp { get; set; }
    public int? BoxQuantity { get; set; }
    public List<BoxCount> Boxes { get; set; } = new();
    public List<HeroSnapshot> Heroes { get; set; } = new();
    public List<string> ArrangedHeroKeys { get; set; } = new();
    public List<RuneLevel> Runes { get; set; } = new();
    public List<HeroAttributeLevel> HeroAttributes { get; set; } = new();
    public List<PetSnapshot> Pets { get; set; } = new();
    public InventorySummary? Inventory { get; set; }
    public MeltSummary? Melt { get; set; }
    public GoldFlow? GoldFlow { get; set; }
    public HeroEvents? HeroEvents { get; set; }
    public StageEvents? StageEvents { get; set; }
    public StageFarm? StageFarm { get; set; }

    [JsonIgnore]
    public object? Raw { get; set; }
}

public sealed class NewsItem
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Url { get; set; } = "";
    public string? Author { get; set; }
    public string Summary { get; set; } = "";
    public long Date { get; set; }
    public string FeedLabel { get; set; } = "";
}

public sealed class NewsFeed
{
    public long FetchedAt { get; set; }
    public List<NewsItem> Items { get; set; } = new();
    public string? Error { get; set; }
}

public sealed class TrackerState
{
    public string Status { get; set; } = ConnectionStatus.NoSave;
    public string? SavePath { get; set; }
    public bool HasKey { get; set; }
    public string? LastError { get; set; }
    public Snapshot? Snapshot { get; set; }
    public long? LastChangeAt { get; set; }
    public long? HeartbeatAt { get; set; }

    public TrackerState Clone() => (TrackerState)MemberwiseClone();
}

/// <summary>Resultado da descoberta automatica da chave ES3 (KeyFindStatus do TS).</summary>
public static class KeyFindStatus
{
    public const string Found = "found";
    public const string NoSave = "no-save";
    public const string NoGame = "no-game";
    public const string NotFound = "not-found";
    public const string Cancelled = "cancelled";
    public const string Error = "error";
}

public sealed class KeyFindResult
{
    public string Status { get; set; } = "";
    public string? GamePath { get; set; }
    public string? Message { get; set; }
    // So usado internamente pelo KeyFinder; nao retornado a UI.
    [JsonIgnore]
    public string? Key { get; set; }
}

/// <summary>Ids canonicos dos widgets do Dashboard (WidgetId do TS).</summary>
public static class WidgetIds
{
    public const string Cards = "cards";
    public const string RuneTarget = "runeTarget";
    public const string GoldFlow = "goldFlow";
    public const string LevelUps = "levelUps";
    public const string StageProgress = "stageProgress";
    public const string Boxes = "boxes";
    public const string InventoryRarity = "inventoryRarity";
    public const string Meltdown = "meltdown";
    public const string Pets = "pets";
    public const string CubeMilestones = "cubeMilestones";
    public const string ActiveHeroes = "activeHeroes";
    public const string RawJson = "rawJson";

    // Ordem canonica (== ordem de render no Dashboard).
    public static readonly string[] All =
    {
        Cards, RuneTarget, GoldFlow, LevelUps, StageProgress,
        Boxes, InventoryRarity, Meltdown, Pets, CubeMilestones, ActiveHeroes, RawJson
    };
}

public sealed class DashboardLayout
{
    public List<string> Hidden { get; set; } = new();
    public List<string> Collapsed { get; set; } = new();

    public static DashboardLayout Default() => new()
    {
        Hidden = new List<string> { WidgetIds.RawJson },
        Collapsed = new List<string>()
    };
}

public sealed class BoxThresholds
{
    public int Warn { get; set; }
    public int High { get; set; }
}

public sealed class StatInfo
{
    public string Stat { get; set; } = "";
    public int Count { get; set; }
    public List<string> Effects { get; set; } = new();
    public List<string> Icons { get; set; } = new();
}
