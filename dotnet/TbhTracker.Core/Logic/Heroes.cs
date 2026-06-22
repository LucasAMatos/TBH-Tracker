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

// H14 — XP para o próximo level-up de um herói.
public sealed class HeroLevelXp
{
    public int Level { get; init; }
    public bool Maxed { get; init; }
    public double? NeededForNext { get; init; }   // XP total exigido para o próximo nível
    public double CurrentExp { get; init; }        // XP no nível atual (do save)
    public double? Remaining { get; init; }        // quanto falta (needed − current)
    public double? Progress { get; init; }         // current / needed (0..1)
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

    // Curva de XP por nível (datamine DB.levels). levels[L-1] = XP do nível L para o L+1.
    private static IReadOnlyList<double> LevelCurve => Core.Catalog.Levels.Levels;

    public static int MaxLevel => LevelCurve.Count;

    /// <summary>XP para o próximo level-up de um herói (H14). Assume que <paramref name="exp"/>
    /// é o progresso de XP no nível atual (campo `HeroExp` do save). Indexação: o herói no
    /// nível L precisa de levels[L-1] para o próximo; níveis fora da curva contam como máx.</summary>
    public static HeroLevelXp LevelProgress(int? level, double? exp)
    {
        var lvl = level ?? 0;
        var curExp = exp ?? 0;
        var curve = LevelCurve;

        // Sem nível conhecido (sem save) ou no/além do máximo: sem "próximo nível".
        if (lvl <= 0)
            return new HeroLevelXp { Level = lvl, Maxed = false, NeededForNext = null, CurrentExp = curExp, Remaining = null, Progress = null };

        if (lvl >= curve.Count)
            return new HeroLevelXp { Level = lvl, Maxed = true, NeededForNext = null, CurrentExp = curExp, Remaining = null, Progress = null };

        var needed = curve[lvl - 1];
        var remaining = Math.Max(0, needed - curExp);
        var progress = needed <= 0 ? 1 : Math.Clamp(curExp / needed, 0, 1);
        return new HeroLevelXp
        {
            Level = lvl,
            Maxed = false,
            NeededForNext = needed,
            CurrentExp = curExp,
            Remaining = remaining,
            Progress = progress
        };
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
