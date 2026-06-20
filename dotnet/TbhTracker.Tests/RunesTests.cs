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
