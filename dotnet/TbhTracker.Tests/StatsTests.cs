using System.Globalization;
using TbhTracker.Core;
using TbhTracker.Core.Logic;

namespace TbhTracker.Tests;

public class StatsTests
{
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    [Fact]
    public void StatList_CoversAllStatIdsSortedByName()
    {
        Assert.Equal(Catalog.Stats.StatIds.Count, Stats.StatList.Count);
        for (var i = 1; i < Stats.StatList.Count; i++)
            Assert.True(string.Compare(Stats.StatList[i - 1].Name, Stats.StatList[i].Name, PtBr, CompareOptions.None) <= 0);
    }

    [Fact]
    public void EveryModReferencesACatalogStat()
    {
        foreach (var (_, mod) in Catalog.Stats.StatMods)
        {
            var statIdx = (int)mod[0];
            Assert.InRange(statIdx, 0, Catalog.Stats.StatIds.Count - 1);
        }
    }

    [Fact]
    public void StatName_And_StatLine_ResolveKnown()
    {
        Assert.False(string.IsNullOrEmpty(Stats.StatName("Armor")));
        Assert.Contains("{0}", Stats.StatLine("Armor"));
    }

    [Fact]
    public void StatName_And_StatLine_FallBackToId()
    {
        Assert.Equal("NaoExiste", Stats.StatName("NaoExiste"));
        Assert.Equal("NaoExiste +{0}", Stats.StatLine("NaoExiste"));
    }

    [Fact]
    public void FormatStatLine_SubstitutesTemplate() =>
        Assert.Equal(Stats.StatLine("Armor").Replace("{0}", "35"), Stats.FormatStatLine("Armor", 35));

    [Fact]
    public void FormatStatLine_AppendsWhenNoTemplate() =>
        Assert.Equal("SemTemplate +10", Stats.FormatStatLine("SemTemplate", 10));

    [Fact]
    public void ModsForStat_OrderedByMin()
    {
        var mods = Stats.ModsForStat("AttackDamage");
        Assert.NotEmpty(mods);
        for (var i = 1; i < mods.Count; i++)
            Assert.True(mods[i - 1].Min <= mods[i].Min);
    }

    [Fact]
    public void StatRange_CoherentMinMax()
    {
        var r = Stats.StatRange("AttackDamage");
        Assert.NotNull(r);
        Assert.True(r!.Value.Min <= r.Value.Max);
    }

    [Fact]
    public void StatRange_NullWhenNoMod() => Assert.Null(Stats.StatRange("NaoExiste"));

    [Fact]
    public void GradeSlotTotal_CommonZeroLegendaryMore()
    {
        Assert.Equal(0, Stats.GradeSlotTotal("COMMON"));
        Assert.True(Stats.GradeSlotTotal("LEGENDARY") > Stats.GradeSlotTotal("COMMON"));
    }

    [Fact]
    public void GradeSlotTotal_UnknownZero() => Assert.Equal(0, Stats.GradeSlotTotal("XYZ"));
}
