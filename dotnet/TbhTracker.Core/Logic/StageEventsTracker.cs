using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/main/stageEvents.ts.

public sealed class StageEventsState
{
    public string? LastStageRaw { get; set; }
    public string? LastMaxRaw { get; set; }
    public List<StageEvent> Events { get; set; } = new();
    public long? SessionStartAt { get; set; }
}

public sealed class StageEventsTracker
{
    private const int MaxEvents = 50;

    private string? _lastStageRaw;
    private string? _lastMaxRaw;
    private List<StageEvent> _events = new();
    private long? _sessionStartAt;

    public void Reset()
    {
        _lastStageRaw = null;
        _lastMaxRaw = null;
        _events = new();
        _sessionStartAt = null;
    }

    public StageEventsState Serialize() => new()
    {
        LastStageRaw = _lastStageRaw,
        LastMaxRaw = _lastMaxRaw,
        Events = _events,
        SessionStartAt = _sessionStartAt
    };

    public void Restore(StageEventsState? state)
    {
        _lastStageRaw = state?.LastStageRaw;
        _lastMaxRaw = state?.LastMaxRaw;
        _events = state?.Events ?? new();
        _sessionStartAt = state?.SessionStartAt;
    }

    public StageEvents? Record(long at, StageInfo? stage, StageInfo? maxStage)
    {
        if (stage == null && maxStage == null) return Current();
        _sessionStartAt ??= at;

        if (stage != null)
        {
            var prev = _lastStageRaw;
            if (prev != null && prev != stage.Raw)
                Push(new StageEvent { At = at, Kind = StageEventKind.StageChange, FromRaw = prev, ToRaw = stage.Raw, ToLabel = stage.Label });
            _lastStageRaw = stage.Raw;
        }

        if (maxStage != null)
        {
            var prev = _lastMaxRaw;
            if (prev != null && long.Parse(maxStage.Raw) > long.Parse(prev))
                Push(new StageEvent { At = at, Kind = StageEventKind.NewMax, FromRaw = prev, ToRaw = maxStage.Raw, ToLabel = maxStage.Label });
            _lastMaxRaw = maxStage.Raw;
        }

        return Current();
    }

    private void Push(StageEvent ev)
    {
        _events.Add(ev);
        if (_events.Count > MaxEvents) _events.RemoveAt(0);
    }

    private StageEvents? Current()
    {
        if (_sessionStartAt == null) return null;
        var events = new List<StageEvent>(_events);
        events.Reverse();
        return new StageEvents { SessionStartAt = _sessionStartAt.Value, Events = events };
    }
}
