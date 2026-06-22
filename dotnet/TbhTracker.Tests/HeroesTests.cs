using TbhTracker.Core;
using TbhTracker.Core.Logic;

namespace TbhTracker.Tests;

public class HeroesTests
{
    [Fact]
    public void LevelCurve_Has100Entries() => Assert.Equal(100, Heroes.MaxLevel);

    [Fact]
    public void LevelProgress_NoLevel_NoNext()
    {
        var p = Heroes.LevelProgress(null, null);
        Assert.False(p.Maxed);
        Assert.Null(p.NeededForNext);
        Assert.Null(p.Remaining);
    }

    [Fact]
    public void LevelProgress_Level1_UsesFirstCurveEntry()
    {
        var needed = Catalog.Levels.Levels[0];
        var p = Heroes.LevelProgress(1, 0);
        Assert.Equal(needed, p.NeededForNext);
        Assert.Equal(needed, p.Remaining);
        Assert.Equal(0d, p.Progress);
    }

    [Fact]
    public void LevelProgress_PartialExp_ComputesRemainingAndProgress()
    {
        var needed = Catalog.Levels.Levels[0];
        var exp = needed / 4;
        var p = Heroes.LevelProgress(1, exp);
        Assert.Equal(needed - exp, p.Remaining);
        Assert.Equal(0.25d, p.Progress!.Value, 3);
    }

    [Fact]
    public void LevelProgress_AtMaxLevel_Maxed()
    {
        var p = Heroes.LevelProgress(Heroes.MaxLevel, 0);
        Assert.True(p.Maxed);
        Assert.Null(p.NeededForNext);
    }

    [Fact]
    public void LevelProgress_ExpClampedToNeeded()
    {
        var needed = Catalog.Levels.Levels[1];
        var p = Heroes.LevelProgress(2, needed * 2);
        Assert.Equal(0d, p.Remaining);
        Assert.Equal(1d, p.Progress);
    }
}
