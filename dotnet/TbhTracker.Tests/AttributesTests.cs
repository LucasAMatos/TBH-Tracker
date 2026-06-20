using System.Globalization;
using System.Text.RegularExpressions;
using TbhTracker.Core;
using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.Tests;

public class AttributesTests
{
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");
    private static AttrNode Armor => Catalog.Attributes.Nodes.First(n => n.Id == 101011);

    [Fact]
    public void Catalog_Has132NodesSixHeroes22Each()
    {
        Assert.Equal(132, Catalog.Attributes.Nodes.Count);
        var heroes = Attributes.AttrHeroes();
        Assert.Equal(new[] { 101, 201, 301, 401, 501, 601 }, heroes);
        foreach (var h in heroes)
            Assert.Equal(22, Attributes.NodesForHero(h).Count);
    }

    [Fact]
    public void EveryNodeHasEffect()
    {
        foreach (var n in Catalog.Attributes.Nodes)
        {
            if (n.Kind == "passive")
                Assert.False(string.IsNullOrEmpty(n.St ?? n.Name));
            else
                Assert.NotNull(n.Dmg);
        }
    }

    [Fact]
    public void AttrEffectAtLevel_PassiveScalesPerPoint()
    {
        Assert.Equal("passive", Armor.Kind);
        Assert.Contains("{0}", Armor.Line);
        var expected = Armor.Line!.Replace("{0}", ((Armor.V ?? 0) * 5).ToString("#,##0.##", PtBr));
        Assert.Equal(expected, Attributes.AttrEffectAtLevel(Armor, 5));
    }

    [Fact]
    public void AttrEffectAtLevel_ZeroFallsBackToPerLevel()
    {
        Assert.Equal(Attributes.AttrPerLevel(Armor), Attributes.AttrEffectAtLevel(Armor, 0));
        Assert.Matches("por ponto", Attributes.AttrPerLevel(Armor));
    }

    [Fact]
    public void Active_DescribesPerLevelScale()
    {
        var active = Catalog.Attributes.Nodes.First(n => n.Kind == "active");
        Assert.Matches(new Regex("ataque|habilidade", RegexOptions.IgnoreCase), Attributes.AttrTitle(active));
        Assert.Matches("valor", Attributes.AttrPerLevel(active));
    }

    [Fact]
    public void HeroAttributeTree_EmptyAllocation()
    {
        var tree = Attributes.HeroAttributeTree(101, new List<HeroAttributeLevel>());
        Assert.Equal(22, tree.TotalNodes);
        Assert.Equal(0, tree.TotalAllocated);
        Assert.Equal(0, tree.AllocatedNodes);
        var xs = tree.Columns.Select(c => c.X).ToList();
        Assert.Equal(xs.OrderBy(x => x).ToList(), xs);
    }

    [Fact]
    public void HeroAttributeTree_CrossesAllocatedLevels()
    {
        var tree = Attributes.HeroAttributeTree(101, new List<HeroAttributeLevel>
        {
            new() { Key = 101011, Level = 5 },
            new() { Key = 101001, Level = 2 }
        });
        Assert.Equal(7, tree.TotalAllocated);
        Assert.Equal(2, tree.AllocatedNodes);
        var node = tree.Columns.SelectMany(c => c.Nodes).First(v => v.Node.Id == 101011);
        Assert.Equal(5, node.Level);
    }

    [Fact]
    public void HeroAttributeTree_IgnoresLevelsFromOtherHero()
    {
        var tree = Attributes.HeroAttributeTree(201, new List<HeroAttributeLevel> { new() { Key = 101011, Level = 5 } });
        Assert.Equal(0, tree.TotalAllocated);
    }
}
