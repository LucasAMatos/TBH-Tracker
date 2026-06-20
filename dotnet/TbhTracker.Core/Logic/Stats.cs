using System.Globalization;
using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/shared/stats.ts (catalogo cru vem de statData.json).

public sealed class StatType
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string Line { get; init; } = "";
}

public sealed class ResolvedMod
{
    public string Key { get; init; } = "";
    public string StatId { get; init; } = "";
    public string ModType { get; init; } = "";
    public double Min { get; init; }
    public double Max { get; init; }
}

public static class Stats
{
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");
    private static StatDataModel D => Catalog.Stats;

    public static string StatName(string id) =>
        D.StatStrings.TryGetValue(id, out var s) ? s.Name : id;

    public static string StatLine(string id) =>
        D.StatStrings.TryGetValue(id, out var s) ? s.Line : $"{id} +{{0}}";

    /// <summary>Numero no padrao pt-BR (inteiro quando possivel, senao ate 2 casas).</summary>
    public static string FmtValue(double value)
    {
        var isInt = value == Math.Floor(value);
        return value.ToString(isInt ? "#,##0" : "#,##0.##", PtBr);
    }

    public static string FormatStatLine(string id, double value)
    {
        var line = StatLine(id);
        var v = FmtValue(value);
        return line.Contains("{0}") ? line.Replace("{0}", v) : $"{line} +{v}";
    }

    private static List<StatType>? _statList;
    public static IReadOnlyList<StatType> StatList => _statList ??= D.StatIds
        .Select(id => new StatType { Id = id, Name = StatName(id), Line = StatLine(id) })
        .OrderBy(s => s.Name, StringComparer.Create(PtBr, false))
        .ToList();

    private static ResolvedMod ResolveMod(string key, double[] mod)
    {
        var statIdx = (int)mod[0];
        var mtIdx = (int)mod[1];
        return new ResolvedMod
        {
            Key = key,
            StatId = statIdx >= 0 && statIdx < D.StatIds.Count ? D.StatIds[statIdx] : "?",
            ModType = mtIdx >= 0 && mtIdx < D.ModTypes.Count ? D.ModTypes[mtIdx] : D.ModTypes[0],
            Min = mod[2],
            Max = mod[3]
        };
    }

    public static List<ResolvedMod> ModsForStat(string statId)
    {
        var outList = new List<ResolvedMod>();
        foreach (var (key, mod) in D.StatMods)
        {
            var idx = (int)mod[0];
            if (idx >= 0 && idx < D.StatIds.Count && D.StatIds[idx] == statId)
                outList.Add(ResolveMod(key, mod));
        }
        return outList.OrderBy(a => a.Min).ThenBy(a => a.Max).ToList();
    }

    public static (double Min, double Max)? StatRange(string statId)
    {
        var mods = ModsForStat(statId);
        if (mods.Count == 0) return null;
        return (mods.Min(m => m.Min), mods.Max(m => m.Max));
    }

    public static GradeSlots? GradeSlotsFor(string grade) =>
        D.GradeSlots.TryGetValue(grade, out var s) ? s : null;

    public static int GradeSlotTotal(string grade)
    {
        if (!D.GradeSlots.TryGetValue(grade, out var s)) return 0;
        return s.Inherent + s.Deco + s.Engr + s.Inscr + s.Extra;
    }

    public static AffixRep? AffixRepFor(string statId) =>
        D.AffixRep.TryGetValue(statId, out var a) ? a : null;
}
