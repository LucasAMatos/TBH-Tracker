using System.Globalization;
using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/shared/runes.ts (catalogo cru vem de runeTree.json).

public sealed class RuneCategoryMeta
{
    public string Label { get; init; } = "";
    public string Color { get; init; } = "";
}

public sealed class RuneProgressCategory
{
    public int Owned { get; set; }
    public int Total { get; set; }
}

public sealed class RuneProgress
{
    public int OwnedNodes { get; set; }
    public int TotalNodes { get; set; }
    public int MaxedNodes { get; set; }
    public Dictionary<string, RuneProgressCategory> ByCategory { get; set; } = new();
}

public static class Runes
{
    public static readonly IReadOnlyDictionary<string, RuneCategoryMeta> CategoryMeta =
        new Dictionary<string, RuneCategoryMeta>
        {
            ["chests"] = new() { Label = "Baús", Color = "#d2a24c" },
            ["hero"] = new() { Label = "Herói", Color = "#f85149" },
            ["gold"] = new() { Label = "Ouro", Color = "#ffb020" },
            ["exp"] = new() { Label = "EXP", Color = "#3fb950" },
            ["slots"] = new() { Label = "Ranhuras", Color = "#a371f7" },
            ["offline"] = new() { Label = "Offline", Color = "#56d4dd" },
            ["cube"] = new() { Label = "Cubo", Color = "#f778ba" },
            ["combat"] = new() { Label = "Combate", Color = "#db6d28" }
        };

    public static int TotalRuneNodes => Catalog.Runes.Nodes.Count;

    private static Dictionary<int, RuneNode>? _byKey;
    private static Dictionary<int, RuneNode> ByKey =>
        _byKey ??= Catalog.Runes.Nodes.ToDictionary(n => n.Key);

    private static Dictionary<int, List<int>>? _parentsByKey;
    private static Dictionary<int, List<int>> ParentsByKey
    {
        get
        {
            if (_parentsByKey != null) return _parentsByKey;
            var map = new Dictionary<int, List<int>>();
            foreach (var e in Catalog.Runes.Edges)
            {
                if (!map.TryGetValue(e.To, out var arr))
                    map[e.To] = arr = new List<int>();
                arr.Add(e.From);
            }
            return _parentsByKey = map;
        }
    }

    public static RuneNode? RuneByKey(int key) => ByKey.TryGetValue(key, out var n) ? n : null;

    public static string RuneColor(RuneNode node) =>
        CategoryMeta.TryGetValue(node.Category, out var m) ? m.Color : "#8b949e";

    public static string FormatRuneEffect(RuneNode node, int level)
    {
        if (node.Values.Count == 0) return node.Effect.Replace("{0}", "?");
        var idx = Math.Max(0, Math.Min((level <= 0 ? 1 : level) - 1, node.Values.Count - 1));
        var v = node.Values[idx];
        return node.Effect.Replace("{0}", FmtNum(v));
    }

    private static string FmtNum(double v) =>
        v == Math.Floor(v) ? ((long)v).ToString(CultureInfo.InvariantCulture)
                           : v.ToString(CultureInfo.InvariantCulture);

    public static double NextLevelGoldCost(RuneNode node, int currentLevel)
    {
        if (currentLevel >= node.MaxLevel) return 0;
        return currentLevel < node.GoldCost.Count ? node.GoldCost[currentLevel] : 0;
    }

    public static double InvestedGold(RuneNode node, int currentLevel)
    {
        double sum = 0;
        for (var i = 0; i < Math.Min(currentLevel, node.GoldCost.Count); i++) sum += node.GoldCost[i];
        return sum;
    }

    public static RuneProgress SummarizeRunes(IEnumerable<RuneLevel> levels)
    {
        var levelByKey = levels.ToDictionary(l => l.Key, l => l.Level);
        var byCategory = CategoryMeta.Keys.ToDictionary(c => c, _ => new RuneProgressCategory());

        var ownedNodes = 0;
        var maxedNodes = 0;
        foreach (var node in Catalog.Runes.Nodes)
        {
            var lv = levelByKey.TryGetValue(node.Key, out var l) ? l : 0;
            if (!byCategory.TryGetValue(node.Category, out var cat))
                byCategory[node.Category] = cat = new RuneProgressCategory();
            cat.Total++;
            if (lv > 0)
            {
                ownedNodes++;
                cat.Owned++;
                if (lv >= node.MaxLevel) maxedNodes++;
            }
        }
        return new RuneProgress
        {
            OwnedNodes = ownedNodes,
            TotalNodes = Catalog.Runes.Nodes.Count,
            MaxedNodes = maxedNodes,
            ByCategory = byCategory
        };
    }

    // ── Runa-alvo (R3) ───────────────────────────────────────────────────────

    private static (double Gold, bool NonGold) LevelGold(RuneNode node, int from, int to)
    {
        double gold = 0;
        var nonGold = false;
        for (var i = from; i < to; i++)
        {
            var c = i < node.GoldCost.Count ? node.GoldCost[i] : 0;
            if (c > 0) gold += c;
            else nonGold = true;
        }
        return (gold, nonGold);
    }

    private sealed class ChainResult
    {
        public double Cost;
        public List<int> Chain = new();
        public bool NonGold;
        public bool Reachable;
    }

    private static ChainResult Unreachable() =>
        new() { Cost = double.PositiveInfinity, Chain = new(), NonGold = false, Reachable = false };

    private static ChainResult CheapestUnlock(
        int key, Dictionary<int, int> levelByKey, Dictionary<int, ChainResult> memo, HashSet<int> stack)
    {
        if ((levelByKey.TryGetValue(key, out var lv) ? lv : 0) > 0)
            return new ChainResult { Cost = 0, Chain = new(), NonGold = false, Reachable = true };
        if (memo.TryGetValue(key, out var cached)) return cached;
        if (stack.Contains(key)) return Unreachable();

        if (!ByKey.TryGetValue(key, out var node)) return Unreachable();

        stack.Add(key);
        var parents = ParentsByKey.TryGetValue(key, out var p) ? p : new List<int>();
        var bestParent = new ChainResult { Cost = 0, Chain = new(), NonGold = false, Reachable = true };
        if (parents.Count > 0)
        {
            bestParent = Unreachable();
            foreach (var par in parents)
            {
                var r = CheapestUnlock(par, levelByKey, memo, stack);
                if (r.Reachable && r.Cost < bestParent.Cost) bestParent = r;
            }
        }
        stack.Remove(key);

        ChainResult result;
        if (!bestParent.Reachable)
        {
            result = Unreachable();
        }
        else
        {
            var own = LevelGold(node, 0, 1);
            result = new ChainResult
            {
                Cost = bestParent.Cost + own.Gold,
                Chain = new List<int>(bestParent.Chain) { key },
                NonGold = bestParent.NonGold || own.NonGold,
                Reachable = true
            };
        }
        memo[key] = result;
        return result;
    }

    public static RuneTargetPlan? PlanRuneTarget(int targetKey, IEnumerable<RuneLevel> levels, double? gold)
    {
        if (!ByKey.TryGetValue(targetKey, out var node)) return null;

        var levelByKey = levels.ToDictionary(l => l.Key, l => l.Level);
        var currentLevel = levelByKey.TryGetValue(targetKey, out var cl) ? cl : 0;

        var memo = new Dictionary<int, ChainResult>();
        var parents = ParentsByKey.TryGetValue(targetKey, out var p) ? p : new List<int>();
        var prereq = new ChainResult { Cost = 0, Chain = new(), NonGold = false, Reachable = true };
        if (parents.Count > 0)
        {
            prereq = Unreachable();
            foreach (var par in parents)
            {
                var r = CheapestUnlock(par, levelByKey, memo, new HashSet<int>());
                if (r.Reachable && r.Cost < prereq.Cost) prereq = r;
            }
        }

        var steps = new List<RuneTargetStep>();
        foreach (var k in prereq.Chain)
        {
            if (!ByKey.TryGetValue(k, out var n)) continue;
            var g = n.GoldCost.Count > 0 ? n.GoldCost[0] : 0;
            steps.Add(new RuneTargetStep
            {
                Key = k,
                Name = n.Name,
                Icon = n.Icon,
                Category = n.Category,
                FromLevel = 0,
                ToLevel = 1,
                GoldCost = g,
                PayableInGold = g > 0,
                IsTarget = false,
                Affordable = false
            });
        }

        var alreadyComplete = currentLevel >= node.MaxLevel;
        var targetLeveling = LevelGold(node, currentLevel, node.MaxLevel);
        if (!alreadyComplete)
        {
            for (int i = currentLevel; i < node.MaxLevel; i++)
            {
                var targetStep = LevelGold(node, i, i+1);

                steps.Add(new RuneTargetStep
                {
                    Key = targetKey,
                    Name = node.Name,
                    Icon = node.Icon,
                    Category = node.Category,
                    FromLevel = i,
                    ToLevel = i+1,
                    GoldCost = targetStep.Gold,
                    PayableInGold = targetStep.Gold > 0,
                    IsTarget = true,
                    Affordable = false
                });
            }
        }

        var totalGoldCost = steps.Sum(s => s.GoldCost);
        var goldHave = gold;

        double running = 0;
        foreach (var step in steps)
        {
            running += step.GoldCost;
            step.Affordable = goldHave != null && running <= goldHave;
        }

        var goldMissing = goldHave == null ? totalGoldCost : Math.Max(0, totalGoldCost - goldHave.Value);
        var progress = totalGoldCost <= 0
            ? 1
            : goldHave == null
                ? 0
                : Math.Max(0, Math.Min(1, goldHave.Value / totalGoldCost));

        return new RuneTargetPlan
        {
            TargetKey = targetKey,
            TargetName = node.Name,
            TargetIcon = node.Icon,
            Category = node.Category,
            CurrentLevel = currentLevel,
            MaxLevel = node.MaxLevel,
            Reachable = prereq.Reachable,
            AlreadyComplete = alreadyComplete,
            Steps = steps,
            TotalGoldCost = totalGoldCost,
            GoldHave = goldHave,
            GoldMissing = goldMissing,
            Progress = progress,
            HasNonGold = prereq.NonGold || targetLeveling.NonGold
        };
    }
}
