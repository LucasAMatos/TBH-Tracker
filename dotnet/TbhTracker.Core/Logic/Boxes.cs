using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/shared/boxes.ts.

public sealed class BoxType
{
    public string Kind { get; init; } = "";
    public string Label { get; init; } = "";
    public string Color { get; init; } = "";
    public int? AutoOpenSeconds { get; init; }
}

public static class BoxKind
{
    public const string Common = "common";
    public const string StageBoss = "stageBoss";
    public const string ActBoss = "actBoss";
}

public static class Boxes
{
    public static readonly IReadOnlyList<BoxType> BoxTypes = new[]
    {
        new BoxType { Kind = BoxKind.Common, Label = "Comum", Color = "#c9d1d9", AutoOpenSeconds = 300 },
        new BoxType { Kind = BoxKind.StageBoss, Label = "Estágio", Color = "#58a6ff", AutoOpenSeconds = 600 },
        new BoxType { Kind = BoxKind.ActBoss, Label = "Ato", Color = "#f85149", AutoOpenSeconds = null }
    };

    private static readonly Dictionary<int, string> ValueToKind = new()
    {
        [0] = BoxKind.Common,
        [1] = BoxKind.StageBoss,
        [2] = BoxKind.ActBoss
    };

    public static string? KindFromTypeValue(int value) =>
        ValueToKind.TryGetValue(value, out var k) ? k : null;

    public static string BoxColor(string kind) =>
        BoxTypes.FirstOrDefault(t => t.Kind == kind)?.Color ?? "#8b949e";

    public static int? BoxAutoOpenSeconds(string kind) =>
        BoxTypes.FirstOrDefault(t => t.Kind == kind)?.AutoOpenSeconds;

    public static int? BoxDrainSeconds(string kind, int quantity)
    {
        var cooldown = BoxAutoOpenSeconds(kind);
        if (cooldown == null || quantity <= 0) return null;
        return quantity * cooldown.Value;
    }

    public static readonly BoxThresholds DefaultThresholds = new() { Warn = 25, High = 75 };

    public static BoxThresholds NormalizeThresholds(int? warn, int? high)
    {
        var w = Math.Max(1, (int)Math.Round((double)(warn ?? DefaultThresholds.Warn)));
        var h = Math.Max(w, (int)Math.Round((double)(high ?? DefaultThresholds.High)));
        return new BoxThresholds { Warn = w, High = h };
    }

    public static string ClassifyBacklog(int? total, BoxThresholds? thresholds = null)
    {
        thresholds ??= DefaultThresholds;
        if (total == null) return "ok";
        if (total >= thresholds.High) return "high";
        if (total >= thresholds.Warn) return "warn";
        return "ok";
    }
}
