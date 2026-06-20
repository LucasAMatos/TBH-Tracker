using TbhTracker.Core;
using TbhTracker.Core.Logic;

namespace TbhTracker.Tests;

public class StageTests
{
    [Fact]
    public void DecodeStage_NormalPhase()
    {
        var s = Stages.DecodeStage("1101");
        Assert.NotNull(s);
        Assert.Equal("1101", s!.Raw);
        Assert.Equal(1, s.Difficulty);
        Assert.Equal(1, s.Act);
        Assert.Equal(1, s.Phase);
        Assert.False(s.IsBoss);
    }

    [Fact]
    public void DecodeStage_AcceptsNumber() =>
        Assert.Equal("1101", Stages.DecodeStage((double?)1101)!.Raw);

    [Fact]
    public void DecodeStage_BossOnPhase10()
    {
        var s = Stages.DecodeStage((double?)1110);
        Assert.Equal(10, s!.Phase);
        Assert.True(s.IsBoss);
    }

    [Fact]
    public void DecodeStage_RejectsInvalid()
    {
        Assert.Null(Stages.DecodeStage((string?)null));
        Assert.Null(Stages.DecodeStage("abc"));
        Assert.Null(Stages.DecodeStage("5101"));
        Assert.Null(Stages.DecodeStage("1199"));
    }

    [Fact]
    public void DifficultyName_MapsAndNull()
    {
        Assert.Equal("Normal", Stages.DifficultyName(1));
        Assert.Equal("Torment", Stages.DifficultyName(4));
        Assert.Null(Stages.DifficultyName(9));
    }

    [Fact]
    public void StageDataForRaw_FindsAndNull()
    {
        Assert.Equal("1-1", Stages.StageDataForRaw("1101")?.Label);
        Assert.Null(Stages.StageDataForRaw("1110"));
        Assert.Null(Stages.StageDataForRaw("9999"));
    }

    [Fact]
    public void RankStages_SortsDescendingByEfficiency()
    {
        var ranked = Stages.RankStages("gold");
        Assert.Equal(Catalog.Stages.Stages.Count, ranked.Count);
        for (var i = 1; i < ranked.Count; i++)
            Assert.True(ranked[i - 1].GoldPerHP >= ranked[i].GoldPerHP);
    }

    [Fact]
    public void RankStages_RespectsLimit() =>
        Assert.Equal(3, Stages.RankStages("exp", limit: 3).Count);

    [Fact]
    public void RankStages_FiltersByDifficulty() =>
        Assert.All(Stages.RankStages("combo", difficulty: 1), s => Assert.Equal(1, s.Difficulty));

    [Fact]
    public void StagesByDifficulty_FourGroupsSorted()
    {
        var grouped = Stages.StagesByDifficulty();
        Assert.Equal(new[] { 1, 2, 3, 4 }, grouped.Keys.OrderBy(k => k).ToArray());
        foreach (var list in grouped.Values)
            for (var i = 1; i < list.Count; i++)
                Assert.True(list[i - 1].Key < list[i].Key);
    }

    [Fact]
    public void StageProgress_NoProgressAllZero()
    {
        var p = Stages.StageProgress(null);
        Assert.Equal(4, p.Count);
        Assert.All(p, d => { Assert.Equal(0, d.Completed); Assert.Equal(0, d.Fraction); });
    }

    [Fact]
    public void StageProgress_1109CompletesNormalAct1()
    {
        var p = Stages.StageProgress("1109");
        var normal = p.First(d => d.Difficulty == 1);
        var act1 = normal.Acts.First(a => a.Act == 1);
        Assert.Equal(act1.Total, act1.Completed);
        Assert.Equal(0, normal.Acts.First(a => a.Act == 2).Completed);
        Assert.Equal(0, p.First(d => d.Difficulty == 2).Completed);
    }

    [Fact]
    public void StageProgress_ActBossMarksActComplete() =>
        Assert.Equal(
            Stages.StageProgress("1109").First(d => d.Difficulty == 1).Completed,
            Stages.StageProgress("1110").First(d => d.Difficulty == 1).Completed);

    [Fact]
    public void StageProgress_AboveCatalogAll100Percent() =>
        Assert.All(Stages.StageProgress("4310"), d => Assert.Equal(1, d.Fraction));

    [Fact]
    public void LevelAdvice_Ok() =>
        Assert.Equal("ok", Stages.ComputeLevelAdvice("1203", new[] { 15, 15, 15 }).Status);

    [Fact]
    public void LevelAdvice_Under()
    {
        var a = Stages.ComputeLevelAdvice("1203", new[] { 10, 10, 10 });
        Assert.Equal("under", a.Status);
        Assert.Equal(-5d, a.Delta!.Value);
    }

    [Fact]
    public void LevelAdvice_Over() =>
        Assert.Equal("over", Stages.ComputeLevelAdvice("1203", new[] { 25, 25 }).Status);

    [Fact]
    public void LevelAdvice_UnknownNoActive() =>
        Assert.Equal("unknown", Stages.ComputeLevelAdvice("1203", Array.Empty<int>()).Status);

    [Fact]
    public void LevelAdvice_UnknownStageOutsideCatalog() =>
        Assert.Equal("unknown", Stages.ComputeLevelAdvice("1110", new[] { 10 }).Status);
}
