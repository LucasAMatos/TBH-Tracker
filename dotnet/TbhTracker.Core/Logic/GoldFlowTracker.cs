using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/main/goldFlow.ts.

public sealed class GoldSample
{
    public long T { get; set; }
    public double Gold { get; set; }
}

public sealed class GoldFlowState
{
    public List<GoldSample> Samples { get; set; } = new();
    public List<GoldEvent> Events { get; set; } = new();
}

public sealed class GoldFlowTracker
{
    private const int MaxEvents = 50;
    private const int MaxSamples = 2000;
    private const int WindowSeconds = 120;
    private const int MinWindowSpan = 8;

    private List<GoldSample> _samples = new();
    private List<GoldEvent> _events = new();

    public void Reset()
    {
        _samples = new();
        _events = new();
    }

    public GoldFlowState Serialize() => new() { Samples = _samples, Events = _events };

    public void Restore(GoldFlowState? state)
    {
        _samples = state?.Samples ?? new();
        _events = state?.Events ?? new();
    }

    public GoldFlow? Record(long at, double? gold)
    {
        if (gold == null) return Current();

        var prev = _samples.Count > 0 ? _samples[^1] : null;
        if (prev == null)
        {
            _samples.Add(new GoldSample { T = at, Gold = gold.Value });
        }
        else if (prev.Gold != gold.Value)
        {
            _events.Add(new GoldEvent { At = at, Delta = gold.Value - prev.Gold, Gold = gold.Value });
            if (_events.Count > MaxEvents) _events.RemoveAt(0);
            _samples.Add(new GoldSample { T = at, Gold = gold.Value });
            if (_samples.Count > MaxSamples) _samples.RemoveAt(0);
        }

        return Current();
    }

    private GoldFlow? Current()
    {
        if (_samples.Count == 0) return null;

        var first = _samples[0];
        var last = _samples[^1];
        var elapsedSeconds = Math.Max(0, (last.T - first.T) / 1000.0);
        var netDelta = last.Gold - first.Gold;
        double? sessionRatePerHour = elapsedSeconds > 0 ? (netDelta / elapsedSeconds) * 3600 : null;

        double? windowRatePerHour = null;
        var windowStart = last.T - WindowSeconds * 1000L;
        var windowSamples = _samples.Where(s => s.T >= windowStart).ToList();
        if (windowSamples.Count >= 2)
        {
            var wf = windowSamples[0];
            var span = (last.T - wf.T) / 1000.0;
            if (span >= MinWindowSpan)
                windowRatePerHour = ((last.Gold - wf.Gold) / span) * 3600;
        }

        var events = new List<GoldEvent>(_events);
        events.Reverse();

        return new GoldFlow
        {
            SessionStartAt = first.T,
            SessionStartGold = first.Gold,
            CurrentGold = last.Gold,
            NetDelta = netDelta,
            ElapsedSeconds = elapsedSeconds,
            SessionRatePerHour = sessionRatePerHour,
            WindowRatePerHour = windowRatePerHour,
            WindowSeconds = WindowSeconds,
            Events = events
        };
    }
}
