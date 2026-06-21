using TbhTracker.Core;
using TbhTracker.Core.Logic;

namespace TbhTracker.Tests;

public class MeltTests
{
    [Fact]
    public void Catalog_HasEntriesWithNonNegativeValues()
    {
        var items = Catalog.Melt.Items;
        Assert.True(items.Count > 1000);
        foreach (var kv in items)
        {
            Assert.True(kv.Value.Length >= 2);
            Assert.True(kv.Value[0] >= 0);
            Assert.True(kv.Value[1] >= 0);
        }
    }

    [Fact]
    public void MeltOf_NullForUnknownKey()
    {
        Assert.Null(Melt.MeltOf(-1));
    }

    [Fact]
    public void MeltOf_ResolvesRealKey()
    {
        var key = int.Parse(Catalog.Melt.Items.Keys.First());
        var v = Melt.MeltOf(key);
        Assert.NotNull(v);
        Assert.Equal(Catalog.Melt.Items[key.ToString()][0], v!.Value.Gold);
        Assert.Equal(Catalog.Melt.Items[key.ToString()][1], v.Value.CubeXp);
    }

    [Fact]
    public void Summarize_OnlyMeltableGear_ExcludesEquippedAndMarketable()
    {
        var realKey = int.Parse(Catalog.Melt.Items.Keys.First());
        var melt = Melt.MeltOf(realKey)!.Value;

        var items = new[]
        {
            new MeltCandidate { Key = realKey, GradeTier = 0, Marketable = false, Equipped = false },
            new MeltCandidate { Key = realKey, GradeTier = 0, Marketable = false, Equipped = true },  // equipado
            new MeltCandidate { Key = realKey, GradeTier = 3, Marketable = true, Equipped = false },  // Legendary+
            new MeltCandidate { Key = 999999999, GradeTier = 1, Marketable = false, Equipped = false } // sem catalogo
        };

        var s = Melt.Summarize(items);
        Assert.Equal(1, s.ItemCount);
        Assert.Equal(melt.Gold, s.TotalGold);
        Assert.Equal(melt.CubeXp, s.TotalCubeXp);
        Assert.Equal(1, s.ExcludedEquipped);
        Assert.Equal(1, s.ExcludedMarketable);
        Assert.Equal(1, s.NoData);
    }

    [Fact]
    public void Summarize_GroupsByRarity_AscendingTier()
    {
        var realKey = int.Parse(Catalog.Melt.Items.Keys.First());
        var melt = Melt.MeltOf(realKey)!.Value;

        var items = new[]
        {
            new MeltCandidate { Key = realKey, GradeTier = 2, Marketable = false, Equipped = false },
            new MeltCandidate { Key = realKey, GradeTier = 0, Marketable = false, Equipped = false },
            new MeltCandidate { Key = realKey, GradeTier = 0, Marketable = false, Equipped = false }
        };

        var s = Melt.Summarize(items);
        Assert.Equal(new[] { 0, 2 }, s.ByRarity.Select(r => r.Tier).ToArray());
        Assert.Equal(2, s.ByRarity[0].Count);
        Assert.Equal(melt.Gold * 2, s.ByRarity[0].Gold);
    }

    [Fact]
    public void Summarize_EmptyForNoCandidates()
    {
        var s = Melt.Summarize(Array.Empty<MeltCandidate>());
        Assert.Equal(0, s.ItemCount);
        Assert.Equal(0, s.TotalGold);
        Assert.Empty(s.ByRarity);
    }
}
