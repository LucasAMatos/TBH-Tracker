using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.App.Services;

/// <summary>A3 — escuta o Tracker e dispara alertas nativos nos 4 eventos (baus, level-up,
/// novo estagio max, runa-alvo compravel), respeitando os toggles persistidos. A decisao de
/// "o que notificar" fica no NotificationDetector (logica pura); aqui so plugamos o estado,
/// os toggles e o canal nativo.</summary>
public sealed class NotificationService
{
    private readonly Tracker _tracker;
    private readonly ConfigStore _store;
    private readonly INotifier _notifier;
    private readonly NotificationDetector _detector = new();
    private readonly Lock _gate = new();
    private bool _started;

    public NotificationService(Tracker tracker, ConfigStore store, INotifier notifier)
    {
        _tracker = tracker;
        _store = store;
        _notifier = notifier;
    }

    public void Start()
    {
        if (_started) return;
        _started = true;
        try { _notifier.Initialize(); } catch { /* notificacoes indisponiveis; segue sem */ }
        _tracker.OnState += OnState;
    }

    private void OnState(TrackerState state)
    {
        if (state.Status != ConnectionStatus.Monitoring || state.Snapshot == null) return;

        lock (_gate)
        {
            var settings = _store.GetNotificationSettings();
            var thresholds = _store.GetBoxThresholds();
            var runeTarget = _store.GetRuneTarget();

            var items = _detector.Detect(state.Snapshot, thresholds, runeTarget);
            foreach (var item in items)
            {
                if (!settings.IsEnabled(item.Category)) continue;
                try { _notifier.Notify(item.Title, item.Body); } catch { /* nao derruba o tracker */ }
            }
        }
    }
}
