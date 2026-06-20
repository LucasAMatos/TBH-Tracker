using System.Globalization;
using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port dos helpers de src/shared/heroes.ts (HERO_CATALOG vem do JSON embutido).

public sealed class HeroStatDef
{
    public string Key { get; init; } = "";
    public string Label { get; init; } = "";
    public Func<double, string> Format { get; init; } = v => v.ToString(CultureInfo.InvariantCulture);
}

public sealed class HeroStatRank
{
    public int Rank { get; init; }
    public int Total { get; init; }
    public bool Best { get; init; }
}

public static class Heroes
{
    public static IReadOnlyList<HeroCatalogEntry> Catalog => Core.Catalog.Heroes;

    private static string Int(double v) =>
        ((long)Math.Round(v)).ToString(CultureInfo.InvariantCulture);

    public static readonly IReadOnlyList<HeroStatDef> StatDefs = new[]
    {
        new HeroStatDef { Key = "atk", Label = "Dano de ataque", Format = Int },
        new HeroStatDef { Key = "atkSpd", Label = "Vel. de ataque", Format = v => $"{v.ToString("0.00", CultureInfo.InvariantCulture)}/s" },
        new HeroStatDef { Key = "crit", Label = "Chance crít.", Format = v => $"{Trim(v)}%" },
        new HeroStatDef { Key = "critDmg", Label = "Dano crítico", Format = v => $"{Trim(v)}%" },
        new HeroStatDef { Key = "hp", Label = "PV máx.", Format = Int },
        new HeroStatDef { Key = "armor", Label = "Armadura", Format = Int },
        new HeroStatDef { Key = "moveSpd", Label = "Vel. de movimento", Format = Int },
        new HeroStatDef { Key = "castSpd", Label = "Vel. de conjuração", Format = v => $"{v.ToString("0.00", CultureInfo.InvariantCulture)}×" },
        new HeroStatDef { Key = "cdr", Label = "Red. recarga", Format = v => $"{Trim(v)}%" }
    };

    private static string Trim(double v) =>
        v == Math.Floor(v) ? ((long)v).ToString(CultureInfo.InvariantCulture)
                           : v.ToString(CultureInfo.InvariantCulture);

    public static double GetStat(HeroBaseStats s, string key) => key switch
    {
        "atk" => s.Atk,
        "atkSpd" => s.AtkSpd,
        "crit" => s.Crit,
        "critDmg" => s.CritDmg,
        "hp" => s.Hp,
        "armor" => s.Armor,
        "moveSpd" => s.MoveSpd,
        "castSpd" => s.CastSpd,
        "cdr" => s.Cdr,
        _ => 0
    };

    public static string HeroName(string? key)
    {
        if (key != null && int.TryParse(key, out var n))
        {
            var hero = Catalog.FirstOrDefault(h => h.Key == n);
            if (hero != null) return hero.Name;
        }
        return key ?? "?";
    }

    public static HeroCatalogEntry? HeroByKey(string? key)
    {
        if (key != null && int.TryParse(key, out var n))
            return Catalog.FirstOrDefault(h => h.Key == n);
        return null;
    }

    public static HeroStatRank StatRank(string statKey, double value)
    {
        var values = Catalog.Select(h => GetStat(h.BaseStats, statKey)).ToList();
        var total = values.Count;
        var better = values.Count(v => v > value);
        var rank = better + 1;
        return new HeroStatRank { Rank = rank, Total = total, Best = rank == 1 };
    }
}
