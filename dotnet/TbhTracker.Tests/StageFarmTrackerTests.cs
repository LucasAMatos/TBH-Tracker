using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.Tests;

public class StageFarmTrackerTests
{
    private const long T0 = 1_700_000_000_000;
    private const long Step = 30_000; // 30s, dentro do MAX_GAP
    private static readonly string[] CompA = { "101", "102", "103" };
    private static readonly string[] CompB = { "201", "202", "203" };

    [Fact]
    public void FirstReadAttributesNothing()
    {
        var tracker = new StageFarmTracker();
        Assert.Null(tracker.Record(T0, "1101", 100, 50, 0));
    }

    [Fact]
    public void AttributesDeltaBetweenReads()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 100, 50, 0);
        var farm = tracker.Record(T0 + Step, "1101", 200, 80, 10);
        var e = farm!.Entries.First(x => x.StageRaw == "1101");
        Assert.Equal(100, e.GoldGained);
        Assert.Equal(30, e.ExpGained);
        Assert.Equal(10, e.KillsGained);
        Assert.Equal(30d, e.Seconds, 3);
    }

    [Fact]
    public void EstimatesClearsFromKills()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 0, 0, 0);
        var farm = tracker.Record(T0 + Step, "1101", 0, 0, 20);
        var e = farm!.Entries.First(x => x.StageRaw == "1101");
        Assert.Equal(2, e.Clears);
        Assert.Equal(15d, e.SecondsPerClear!.Value, 3);
    }

    [Fact]
    public void DiscardsIntervalWhenStageChanges()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 100, 50, 0);
        Assert.Null(tracker.Record(T0 + Step, "1102", 999, 999, 999));
    }

    [Fact]
    public void AttributesDeltaToActiveComp()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 100, 50, 0, CompA);
        var farm = tracker.Record(T0 + Step, "1101", 200, 80, 10, CompA);
        var e = farm!.Entries.Single();

        Assert.Equal("1101", e.StageRaw);
        Assert.Equal("101|102|103", e.CompKey);
        Assert.Equal(CompA, e.CompHeroKeys);
        Assert.Equal(100, e.GoldGained);
    }

    [Fact]
    public void DiscardsIntervalWhenCompChanges()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 100, 50, 0, CompA);
        Assert.Null(tracker.Record(T0 + Step, "1101", 999, 999, 999, CompB));
    }

    [Fact]
    public void SeparatesSameStageByComp()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 0, 0, 0, CompA);
        tracker.Record(T0 + Step, "1101", 100, 10, 10, CompA);
        tracker.Record(T0 + 2 * Step, "1101", 100, 10, 10, CompB); // troca de comp: descarta

        var farm = tracker.Record(T0 + 3 * Step, "1101", 250, 30, 25, CompB);

        Assert.Equal(2, farm!.Entries.Count);
        Assert.Contains(farm.Entries, e => e.StageRaw == "1101" && e.CompKey == "101|102|103" && e.GoldGained == 100);
        Assert.Contains(farm.Entries, e => e.StageRaw == "1101" && e.CompKey == "201|202|203" && e.GoldGained == 150);
    }

    [Fact]
    public void IgnoresNegativeDeltas()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 500, 500, 10);
        var farm = tracker.Record(T0 + Step, "1101", 300, 100, 12);
        var e = farm!.Entries.First(x => x.StageRaw == "1101");
        Assert.Equal(0, e.GoldGained);
        Assert.Equal(0, e.ExpGained);
        Assert.Equal(2, e.KillsGained);
    }

    [Fact]
    public void DiscardsLongIntervals()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 100, 50, 0);
        Assert.Null(tracker.Record(T0 + 10 * 60_000, "1101", 9999, 9999, 9999));
    }

    [Fact]
    public void KeepsOnlyLastTenClearsPerStage()
    {
        // "1101": 10 inimigos por clear (ver EstimatesClearsFromKills). Janela = 10 clears = 100 kills.
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 0, 0, 0); // primeira leitura, sem atribuicao

        StageFarm? farm = null;
        for (int i = 1; i <= 15; i++) // 15 amostras de 1 clear cada (10 kills, 100 ouro)
            farm = tracker.Record(T0 + i * Step, "1101", i * 100, 0, i * 10);

        var e = farm!.Entries.First(x => x.StageRaw == "1101");
        Assert.Equal(10, e.Reads);            // so as ultimas 10 amostras
        Assert.Equal(100, e.KillsGained);     // 10 clears * 10 inimigos
        Assert.Equal(1000, e.GoldGained);     // 10 amostras * 100 ouro
        Assert.Equal(10, e.Clears!.Value, 3); // 100 kills / 10 por clear
        Assert.Equal(300d, e.Seconds, 3);     // 10 amostras * 30s
    }

    [Fact]
    public void FallsBackToSampleCapForStagesWithoutClearCount()
    {
        // Estagio fora do catalogo (sem inimigos/clear): cap por numero de amostras recentes.
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "999999", 0, 0, 0);

        StageFarm? farm = null;
        for (int i = 1; i <= 15; i++)
            farm = tracker.Record(T0 + i * Step, "999999", i * 100, 0, i * 10);

        var e = farm!.Entries.First(x => x.StageRaw == "999999");
        Assert.Equal(10, e.Reads);
        Assert.Null(e.Clears);
    }

    [Fact]
    public void MigratesLegacyAggregateBucketOnRestore()
    {
        // Formato antigo (acumulador unico) deve virar uma amostra inicial no Restore.
        var legacy = new StageFarmState
        {
            Stages = new()
            {
                ["1101"] = new StageBucket
                {
                    GoldGained = 500,
                    ExpGained = 200,
                    KillsGained = 30,
                    Seconds = 90,
                    Reads = 3,
                    LastAt = T0
                }
            },
            LastAt = T0,
            LastStageRaw = "1101",
            LastGold = 500,
            LastExp = 200,
            LastKills = 30
        };

        var tracker = new StageFarmTracker();
        tracker.Restore(legacy);
        var farm = tracker.Record(T0 + Step, "1101", 600, 230, 33);
        var e = farm!.Entries.First(x => x.StageRaw == "1101");
        Assert.Equal(600, e.GoldGained);   // 500 legado + 100 do novo delta
        Assert.Equal(33, e.KillsGained);   // 30 legado + 3 do novo delta
    }

    [Fact]
    public void SerializeRestorePreservesAccumulated()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 100, 50, 0);
        tracker.Record(T0 + Step, "1101", 200, 80, 10);
        var state = tracker.Serialize();

        var revived = new StageFarmTracker();
        revived.Restore(state);
        var farm = revived.Record(T0 + 2 * Step, "1101", 250, 90, 13);
        var e = farm!.Entries.First(x => x.StageRaw == "1101");
        Assert.Equal(150, e.GoldGained);
        Assert.Equal(13, e.KillsGained);
    }

    [Fact]
    public void SerializeRestorePreservesCompBuckets()
    {
        var tracker = new StageFarmTracker();
        tracker.Record(T0, "1101", 100, 50, 0, CompA);
        tracker.Record(T0 + Step, "1101", 200, 80, 10, CompA);
        var state = tracker.Serialize();

        var revived = new StageFarmTracker();
        revived.Restore(state);
        var farm = revived.Record(T0 + 2 * Step, "1101", 250, 90, 13, CompA);
        var e = farm!.Entries.First(x => x.StageRaw == "1101" && x.CompKey == "101|102|103");
        Assert.Equal(150, e.GoldGained);
        Assert.Equal(CompA, e.CompHeroKeys);
    }
}
