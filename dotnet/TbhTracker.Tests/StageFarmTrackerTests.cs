using TbhTracker.Core.Logic;

namespace TbhTracker.Tests;

public class StageFarmTrackerTests
{
    private const long T0 = 1_700_000_000_000;
    private const long Step = 30_000; // 30s, dentro do MAX_GAP

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
}
