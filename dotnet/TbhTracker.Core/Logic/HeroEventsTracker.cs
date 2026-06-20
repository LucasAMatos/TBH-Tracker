using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/main/heroEvents.ts.

public sealed class HeroEventsState
{
    public Dictionary<string, int> Levels { get; set; } = new();
    public List<LevelUpEvent> Events { get; set; } = new();
    public long? SessionStartAt { get; set; }
}

public sealed class HeroEventsTracker
{
    private const int MaxEvents = 50;

    private Dictionary<string, int> _levels = new();
    private List<LevelUpEvent> _events = new();
    private long? _sessionStartAt;

    public void Reset()
    {
        _levels = new();
        _events = new();
        _sessionStartAt = null;
    }

    public HeroEventsState Serialize() => new()
    {
        Levels = _levels,
        Events = _events,
        SessionStartAt = _sessionStartAt
    };

    public void Restore(HeroEventsState? state)
    {
        _levels = state?.Levels ?? new();
        _events = state?.Events ?? new();
        _sessionStartAt = state?.SessionStartAt;
    }

    public HeroEvents? Record(long at, List<HeroSnapshot> heroes)
    {
        if (heroes.Count == 0) return Current();
        _sessionStartAt ??= at;

        foreach (var hero in heroes)
        {
            if (hero.Level == null) continue;
            var id = hero.Key;
            var hadPrev = _levels.TryGetValue(id, out var prev);
            _levels[id] = hero.Level.Value;
            if (!hadPrev) continue;
            if (hero.Level.Value > prev)
            {
                _events.Add(new LevelUpEvent
                {
                    At = at,
                    HeroKey = hero.Key,
                    HeroName = hero.Name,
                    FromLevel = prev,
                    ToLevel = hero.Level.Value
                });
                if (_events.Count > MaxEvents) _events.RemoveAt(0);
            }
        }

        return Current();
    }

    private HeroEvents? Current()
    {
        if (_sessionStartAt == null) return null;
        var levelUps = new List<LevelUpEvent>(_events);
        levelUps.Reverse();
        return new HeroEvents { SessionStartAt = _sessionStartAt.Value, LevelUps = levelUps };
    }
}
