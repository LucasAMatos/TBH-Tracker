using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/main/stageFarm.ts.

public sealed class StageBucket
{
    public double GoldGained { get; set; }
    public double ExpGained { get; set; }
    public double KillsGained { get; set; }
    public double Seconds { get; set; }
    public int Reads { get; set; }
    public long LastAt { get; set; }
}

public sealed class StageFarmState
{
    public Dictionary<string, StageBucket> Stages { get; set; } = new();
    public long? LastAt { get; set; }
    public string? LastStageRaw { get; set; }
    public double? LastGold { get; set; }
    public double? LastExp { get; set; }
    public double? LastKills { get; set; }
}

public sealed class StageFarmTracker
{
    private const int MaxGapSeconds = 180;
    private const int MinSecondsForRate = 20;

    private Dictionary<string, StageBucket> _stages = new();
    private long? _lastAt;
    private string? _lastStageRaw;
    private double? _lastGold;
    private double? _lastExp;
    private double? _lastKills;

    public void Reset()
    {
        _stages = new();
        _lastAt = null;
        _lastStageRaw = null;
        _lastGold = null;
        _lastExp = null;
        _lastKills = null;
    }

    public StageFarmState Serialize() => new()
    {
        Stages = _stages,
        LastAt = _lastAt,
        LastStageRaw = _lastStageRaw,
        LastGold = _lastGold,
        LastExp = _lastExp,
        LastKills = _lastKills
    };

    public void Restore(StageFarmState? state)
    {
        _stages = state?.Stages ?? new();
        _lastAt = state?.LastAt;
        _lastStageRaw = state?.LastStageRaw;
        _lastGold = state?.LastGold;
        _lastExp = state?.LastExp;
        _lastKills = state?.LastKills;
    }

    public StageFarm? Record(long at, string? stageRaw, double? gold, double? totalExp, double? totalKills)
    {
        var canAttribute = _lastAt != null && _lastStageRaw != null
            && stageRaw != null && stageRaw == _lastStageRaw;

        if (canAttribute)
        {
            var dt = (at - _lastAt!.Value) / 1000.0;
            if (dt > 0 && dt <= MaxGapSeconds)
            {
                var bucket = Bucket(stageRaw!);
                bucket.Seconds += dt;
                bucket.Reads += 1;
                bucket.LastAt = at;
                if (gold != null && _lastGold != null)
                    bucket.GoldGained += Math.Max(0, gold.Value - _lastGold.Value);
                if (totalExp != null && _lastExp != null)
                    bucket.ExpGained += Math.Max(0, totalExp.Value - _lastExp.Value);
                if (totalKills != null && _lastKills != null)
                    bucket.KillsGained += Math.Max(0, totalKills.Value - _lastKills.Value);
            }
        }

        _lastAt = at;
        _lastStageRaw = stageRaw;
        if (gold != null) _lastGold = gold;
        if (totalExp != null) _lastExp = totalExp;
        if (totalKills != null) _lastKills = totalKills;

        return Current(stageRaw);
    }

    private StageBucket Bucket(string stageRaw)
    {
        if (!_stages.TryGetValue(stageRaw, out var b))
            _stages[stageRaw] = b = new StageBucket();
        return b;
    }

    private StageFarm? Current(string? currentStageRaw)
    {
        if (_stages.Count == 0) return null;

        var entries = _stages.Select(kv =>
        {
            var stageRaw = kv.Key;
            var b = kv.Value;
            var rateOk = b.Seconds >= MinSecondsForRate;
            var perClear = Stages.StageDataForRaw(stageRaw)?.Count;
            double? clears = perClear is > 0 ? b.KillsGained / perClear.Value : null;
            var hasClears = clears != null && clears > 0;
            return new StageFarmEntry
            {
                StageRaw = stageRaw,
                GoldGained = Math.Round(b.GoldGained),
                ExpGained = Math.Round(b.ExpGained),
                KillsGained = Math.Round(b.KillsGained),
                Seconds = b.Seconds,
                Reads = b.Reads,
                GoldPerHour = rateOk ? (b.GoldGained / b.Seconds) * 3600 : null,
                ExpPerHour = rateOk ? (b.ExpGained / b.Seconds) * 3600 : null,
                Clears = clears,
                ClearsPerHour = rateOk && clears != null ? (clears.Value / b.Seconds) * 3600 : null,
                SecondsPerClear = hasClears ? b.Seconds / clears!.Value : null,
                GoldPerClear = hasClears ? b.GoldGained / clears!.Value : null,
                ExpPerClear = hasClears ? b.ExpGained / clears!.Value : null,
                LastAt = b.LastAt
            };
        }).ToList();
        entries.Sort((a, b) => b.Seconds.CompareTo(a.Seconds));

        return new StageFarm
        {
            Entries = entries,
            TotalSeconds = entries.Sum(e => e.Seconds),
            CurrentStageRaw = currentStageRaw
        };
    }
}
