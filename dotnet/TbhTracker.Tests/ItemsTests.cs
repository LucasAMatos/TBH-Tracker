using TbhTracker.Core;
using TbhTracker.Core.Logic;

namespace TbhTracker.Tests;

public class ItemsTests
{
    [Fact]
    public void ClassifyItem_NullForUnknownKey()
    {
        Assert.Null(Items.ClassifyItem("chave-inexistente"));
        Assert.Null(Items.ClassifyItem("-1"));
    }

    [Fact]
    public void ClassifyItem_ResolvesRealCatalogKey()
    {
        var knownKey = Catalog.Items.Items.Keys.First();
        var info = Items.ClassifyItem(knownKey);
        Assert.NotNull(info);
        Assert.Equal(int.Parse(knownKey), info!.Key);
        Assert.Contains(info.Type, Catalog.Items.ItemTypeIds);
    }

    [Fact]
    public void ClassifyItem_MarketableItemsHaveNonNegativeTier()
    {
        foreach (var key in Catalog.Items.Items.Keys)
        {
            var info = Items.ClassifyItem(key);
            if (info?.Marketable == true)
                Assert.True(info.GradeTier >= 0);
        }
    }
}
