using TbhTracker.Core;
using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.Tests;

public class RunesTests
{
    private static RuneNode FirstNode => Catalog.Runes.Nodes[0];

    [Fact]
    public void SummarizeRunes_EmptyOwnsNothing()
    {
        var s = Runes.SummarizeRunes(new List<RuneLevel>());
        Assert.Equal(0, s.OwnedNodes);
        Assert.Equal(0, s.MaxedNodes);
        Assert.Equal(Runes.TotalRuneNodes, s.TotalNodes);
    }

    [Fact]
    public void SummarizeRunes_CountsOwnedAndMaxed()
    {
        var node = FirstNode;
        var s = Runes.SummarizeRunes(new List<RuneLevel> { new() { Key = node.Key, Level = node.MaxLevel } });
        Assert.Equal(1, s.OwnedNodes);
        Assert.Equal(1, s.MaxedNodes);
    }

    [Fact]
    public void SummarizeMaxCost_EmptyInvestsNothing()
    {
        var m = Runes.SummarizeMaxCost(new List<RuneLevel>());
        Assert.Equal(0, m.InvestedGold);
        Assert.Equal(0, m.OwnedLevels);
        Assert.Equal(m.TotalGold, m.RemainingGold);
        Assert.True(m.TotalGold > 0);
        Assert.True(m.TotalLevels > 0);
        Assert.Equal(0d, m.GoldProgress);
    }

    [Fact]
    public void SummarizeMaxCost_MaxedNodeCountsTowardInvested()
    {
        // Um nó com custo em ouro (algum nível com GoldCost > 0), levado ao máx.
        var node = Catalog.Runes.Nodes.First(n => n.GoldCost.Take(n.MaxLevel).Any(c => c > 0));
        var m = Runes.SummarizeMaxCost(new List<RuneLevel> { new() { Key = node.Key, Level = node.MaxLevel } });
        var nodeGold = Runes.InvestedGold(node, node.MaxLevel);
        Assert.Equal(nodeGold, m.InvestedGold);
        Assert.Equal(node.MaxLevel, m.OwnedLevels);
        Assert.True(m.RemainingGold < m.TotalGold);
    }

    [Fact]
    public void PlanRuneTarget_NullForUnknownKey() =>
        Assert.Null(Runes.PlanRuneTarget(-999, new List<RuneLevel>(), 0));

    [Fact]
    public void PlanRuneTarget_NoGold_MissingEqualsTotal()
    {
        var node = FirstNode;
        var plan = Runes.PlanRuneTarget(node.Key, new List<RuneLevel>(), null);
        Assert.NotNull(plan);
        Assert.Equal(node.Key, plan!.TargetKey);
        Assert.Equal(plan.TotalGoldCost, plan.GoldMissing);
    }

    [Fact]
    public void PlanRuneTarget_AbundantGold_CompletesProgress()
    {
        var node = FirstNode;
        var plan = Runes.PlanRuneTarget(node.Key, new List<RuneLevel>(), long.MaxValue);
        Assert.Equal(0, plan!.GoldMissing);
        Assert.Equal(1d, plan.Progress);
    }

    [Fact]
    public void PlanRuneTarget_AtMaxLevel_AlreadyComplete()
    {
        var node = FirstNode;
        var plan = Runes.PlanRuneTarget(node.Key,
            new List<RuneLevel> { new() { Key = node.Key, Level = node.MaxLevel } }, 0);
        Assert.True(plan!.AlreadyComplete);
    }
}
