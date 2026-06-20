using System.Globalization;
using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/shared/attributes.ts (catalogo cru vem de attributeData.json).

public sealed class AttrNodeView
{
    public AttrNode Node { get; init; } = new();
    public int Level { get; init; }
    public string Effect { get; init; } = "";
    public string PerLevel { get; init; } = "";
}

public sealed class AttrColumn
{
    public int Grp { get; init; }
    public int X { get; init; }
    public List<AttrNodeView> Nodes { get; init; } = new();
}

public sealed class HeroAttrTree
{
    public int Hero { get; init; }
    public List<AttrColumn> Columns { get; init; } = new();
    public int TotalAllocated { get; init; }
    public int AllocatedNodes { get; init; }
    public int TotalNodes { get; init; }
}

public static class Attributes
{
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    private static string Fmt(double n) => n.ToString("#,##0.##", PtBr);

    private static readonly Dictionary<string, string> ActLabels = new()
    {
        ["BASEATTACK"] = "Ataque básico",
        ["BASEATTACK_COUNT"] = "Ataque básico",
        ["COOLDOWN"] = "Habilidade ativa"
    };

    public static string ActLabel(string? act)
    {
        if (string.IsNullOrEmpty(act)) return "Habilidade ativa";
        return ActLabels.TryGetValue(act, out var l) ? l : "Habilidade ativa";
    }

    public static string AttrTitle(AttrNode node)
    {
        if (node.Kind == "active") return ActLabel(node.Act);
        return node.Name ?? node.St ?? $"Nó {node.Id}";
    }

    private static string FillLine(string? line, double value, string fallbackName)
    {
        var tmpl = line ?? $"{fallbackName} +{{0}}";
        return tmpl.Contains("{0}") ? tmpl.Replace("{0}", Fmt(value)) : $"{tmpl} {Fmt(value)}";
    }

    public static string AttrPerLevel(AttrNode node)
    {
        if (node.Kind == "active")
        {
            var dmg = node.Dmg ?? new List<double>();
            if (dmg.Count == 0) return "—";
            var first = dmg[0];
            var last = dmg[^1];
            return first == last ? $"valor {Fmt(first)}" : $"valor {Fmt(first)} → {Fmt(last)} por nível";
        }
        return FillLine(node.Line, node.V ?? 0, AttrTitle(node)) + " por ponto";
    }

    public static string AttrEffectAtLevel(AttrNode node, int level)
    {
        if (level <= 0) return AttrPerLevel(node);
        if (node.Kind == "active")
        {
            var dmg = node.Dmg ?? new List<double>();
            var idx = Math.Min(level, dmg.Count) - 1;
            var meta = string.Join(" · ", new[] { node.Delivery, node.DmgType }.Where(x => !string.IsNullOrEmpty(x)));
            var cd = node.Cd != null ? $" · recarga {Fmt(node.Cd.Value)}s" : "";
            if (idx >= 0)
                return $"valor {Fmt(dmg[idx])}{(meta.Length > 0 ? $" ({meta})" : "")}{cd}";
            return meta.Length > 0 ? meta : "—";
        }
        return FillLine(node.Line, (node.V ?? 0) * level, AttrTitle(node));
    }

    public static List<int> AttrHeroes() =>
        Catalog.Attributes.Nodes.Select(n => n.Hero).Distinct().OrderBy(h => h).ToList();

    public static List<AttrNode> NodesForHero(int hero) =>
        Catalog.Attributes.Nodes
            .Where(n => n.Hero == hero)
            .OrderBy(n => n.Gx).ThenBy(n => n.Id)
            .ToList();

    public static HeroAttrTree HeroAttributeTree(int hero, IEnumerable<HeroAttributeLevel> allocated)
    {
        var levelByKey = new Dictionary<int, int>();
        foreach (var a in allocated) levelByKey[a.Key] = a.Level;

        var colMap = new Dictionary<int, (int Grp, int X, List<AttrNodeView> Nodes)>();
        var colOrder = new List<int>();
        var totalAllocated = 0;
        var allocatedNodes = 0;

        foreach (var node in NodesForHero(hero))
        {
            var level = levelByKey.TryGetValue(node.Id, out var lv) ? lv : 0;
            if (level > 0)
            {
                totalAllocated += level;
                allocatedNodes++;
            }
            if (!colMap.TryGetValue(node.Grp, out var col))
            {
                col = (node.Grp, node.Gx, new List<AttrNodeView>());
                colMap[node.Grp] = col;
                colOrder.Add(node.Grp);
            }
            col.Nodes.Add(new AttrNodeView
            {
                Node = node,
                Level = level,
                Effect = AttrEffectAtLevel(node, level),
                PerLevel = AttrPerLevel(node)
            });
        }

        var columns = colMap.Values
            .OrderBy(c => c.X)
            .Select(c => new AttrColumn { Grp = c.Grp, X = c.X, Nodes = c.Nodes })
            .ToList();
        var totalNodes = columns.Sum(c => c.Nodes.Count);

        return new HeroAttrTree
        {
            Hero = hero,
            Columns = columns,
            TotalAllocated = totalAllocated,
            AllocatedNodes = allocatedNodes,
            TotalNodes = totalNodes
        };
    }
}
