using System.Text.Json;
using TbhTracker.Core;
using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.App.Services;

/// <summary>Port de src/main/tracker.ts. Orquestra leitura passiva do save: localiza,
/// observa (watcher), descriptografa+parseia, alimenta os trackers de fluxo/eventos,
/// persiste o historico e emite TrackerState. Heartbeat re-emite o estado a cada 5s.</summary>
public sealed class Tracker : IDisposable
{
    private const int HeartbeatMs = 5000;

    private readonly ConfigStore _store;
    private readonly HistoryStore _history;
    private readonly Locator _locator;

    private readonly GoldFlowTracker _goldFlow = new();
    private readonly HeroEventsTracker _heroEvents = new();
    private readonly StageEventsTracker _stageEvents = new();
    private readonly StageFarmTracker _stageFarm = new();

    private SaveWatcher? _watcher;
    private Timer? _heartbeatTimer;
    private string? _trackedPath;
    private readonly Lock _gate = new();

    private TrackerState _state = new()
    {
        Status = ConnectionStatus.NoSave,
        SavePath = null,
        HasKey = false,
        LastError = null,
        Snapshot = null,
        LastChangeAt = null,
        HeartbeatAt = null
    };

    /// <summary>Emitido sempre que o estado muda (ou no heartbeat).</summary>
    public event Action<TrackerState>? OnState;

    public Tracker(ConfigStore store, HistoryStore history, Locator locator)
    {
        _store = store;
        _history = history;
        _locator = locator;
    }

    public TrackerState GetState() => _state;

    private static long NowMs() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    /// <summary>(Re)avalia caminho do save, inicia o watcher e faz uma leitura.</summary>
    public void Start()
    {
        var savePath = _store.GetSavePathOverride() ?? _locator.LocateSave();
        if (savePath != _trackedPath)
        {
            _goldFlow.Restore(_history.LoadHistory<GoldFlowState>(savePath, "goldFlow"));
            _heroEvents.Restore(_history.LoadHistory<HeroEventsState>(savePath, "heroEvents"));
            _stageEvents.Restore(_history.LoadHistory<StageEventsState>(savePath, "stageEvents"));
            _stageFarm.Restore(_history.LoadHistory<StageFarmState>(savePath, "stageFarm"));
            _trackedPath = savePath;
        }
        _state.SavePath = savePath;
        _state.HasKey = _store.HasKey();

        _watcher?.Stop();
        _watcher = null;

        StartHeartbeat();

        if (!string.IsNullOrEmpty(savePath) && File.Exists(savePath))
        {
            _watcher = new SaveWatcher(savePath, ReadSave);
            _watcher.Start();
        }
        else
        {
            _state.Status = ConnectionStatus.NoSave;
            _state.Snapshot = null;
            Emit();
        }
    }

    private void StartHeartbeat()
    {
        _heartbeatTimer?.Dispose();
        _heartbeatTimer = new Timer(_ =>
        {
            _state.HeartbeatAt = NowMs();
            Emit();
        }, null, HeartbeatMs, HeartbeatMs);
    }

    private void ReadSave()
    {
        lock (_gate)
        {
            var savePath = _state.SavePath;
            if (string.IsNullOrEmpty(savePath) || !File.Exists(savePath))
            {
                Update(s => { s.Status = ConnectionStatus.NoSave; s.Snapshot = null; s.LastError = null; });
                return;
            }

            var key = _store.GetKey();
            _state.HasKey = key != null;
            if (key == null)
            {
                Update(s => { s.Status = ConnectionStatus.NoKey; s.LastError = null; });
                return;
            }

            try
            {
                var buffer = File.ReadAllBytes(savePath);
                var json = Es3Crypto.DecryptAndParse(buffer, key);
                var snapshot = SaveParser.ParseSnapshot(json);

                var flow = _goldFlow.Record(snapshot.CapturedAt, snapshot.Gold);
                if (flow != null) snapshot.GoldFlow = flow;

                var heroEvents = _heroEvents.Record(snapshot.CapturedAt, snapshot.Heroes);
                if (heroEvents != null) snapshot.HeroEvents = heroEvents;

                var stageEvents = _stageEvents.Record(snapshot.CapturedAt, snapshot.Stage, snapshot.MaxCompletedStage);
                if (stageEvents != null) snapshot.StageEvents = stageEvents;

                double? totalExp = snapshot.Heroes.Count > 0
                    ? snapshot.Heroes.Sum(h => h.Exp ?? 0)
                    : null;
                var stageFarm = _stageFarm.Record(
                    snapshot.CapturedAt,
                    snapshot.Stage?.Raw,
                    snapshot.Gold,
                    totalExp,
                    snapshot.TotalKills,
                    snapshot.ArrangedHeroKeys);
                if (stageFarm != null) snapshot.StageFarm = stageFarm;

                _history.SaveHistory(savePath, "goldFlow", _goldFlow.Serialize());
                _history.SaveHistory(savePath, "heroEvents", _heroEvents.Serialize());
                _history.SaveHistory(savePath, "stageEvents", _stageEvents.Serialize());
                _history.SaveHistory(savePath, "stageFarm", _stageFarm.Serialize());

                var now = NowMs();
                Update(s =>
                {
                    s.Status = ConnectionStatus.Monitoring;
                    s.Snapshot = snapshot;
                    s.LastError = null;
                    s.LastChangeAt = now;
                    s.HeartbeatAt = now;
                });
            }
            catch (Exception err)
            {
                Update(s => { s.Status = ConnectionStatus.Error; s.LastError = err.Message; });
            }
        }
    }

    public TrackerState Refresh()
    {
        Start();
        return _state;
    }

    /// <summary>Apaga o historico de medicoes de farm (memoria + base persistida) do save atual.</summary>
    public TrackerState ClearStageFarmHistory()
    {
        lock (_gate)
        {
            _stageFarm.Reset();
            _history.SaveHistory(_state.SavePath, "stageFarm", _stageFarm.Serialize());
            _history.Flush();
            if (_state.Snapshot != null) _state.Snapshot.StageFarm = null;
            Emit();
        }
        return _state;
    }

    /// <summary>Le o save agora e devolve so o JSON bruto do player (sob demanda, para o
    /// visualizador de calibracao). Nao toca no estado/snapshot em curso.</summary>
    public object? ReadRawSave()
    {
        var savePath = _state.SavePath;
        if (string.IsNullOrEmpty(savePath) || !File.Exists(savePath)) return null;
        var key = _store.GetKey();
        if (key == null) return null;
        try
        {
            var buffer = File.ReadAllBytes(savePath);
            var json = Es3Crypto.DecryptAndParse(buffer, key);
            return SaveParser.ParseSnapshot(json, includeRaw: true).Raw;
        }
        catch
        {
            return null;
        }
    }

    private void Update(Action<TrackerState> patch)
    {
        patch(_state);
        Emit();
    }

    private void Emit() => OnState?.Invoke(_state);

    public void Stop()
    {
        _watcher?.Stop();
        _watcher = null;
        _heartbeatTimer?.Dispose();
        _heartbeatTimer = null;
        _history.Flush();
    }

    public void Dispose() => Stop();
}
