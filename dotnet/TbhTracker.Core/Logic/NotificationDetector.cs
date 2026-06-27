using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

/// <summary>Categoria de um alerta nativo (A3). Mapeia 1:1 com os toggles persistidos.</summary>
public enum NotificationCategory
{
    ChestsOverflow,
    LevelUp,
    NewMaxStage,
    RuneAffordable
}

/// <summary>Um alerta a ser disparado: titulo + corpo + a categoria (para filtrar por toggle).</summary>
public sealed record NotificationItem(NotificationCategory Category, string Title, string Body, long At);

/// <summary>Logica pura (sem WinUI) que decide quando notificar nos 4 eventos do A3.
///
/// H2 (level-up) e S3 (novo estagio max) ja vem como eventos no Snapshot: notificamos apenas
/// os com At mais novo que o ultimo notificado. B2 (baus) e R3 (runa-alvo) NAO sao eventos:
/// detectamos a transicao de estado entre leituras (subiu de limiar / virou compravel).
///
/// A primeira leitura so estabelece a linha de base — nao dispara nada (evita spam ao abrir o
/// app com estado pre-existente). O heartbeat reemite o mesmo Snapshot; deduplicamos por
/// CapturedAt.</summary>
public sealed class NotificationDetector
{
    private long? _lastSnapshotAt;
    private long _lastLevelUpAt;
    private long _lastStageEventAt;
    private string? _lastBoxLevel;
    private bool? _lastRuneAffordable;
    private int? _lastRuneTargetKey;

    private static int BacklogRank(string level) => level switch
    {
        "high" => 2,
        "warn" => 1,
        _ => 0
    };

    public IReadOnlyList<NotificationItem> Detect(Snapshot? snapshot, BoxThresholds thresholds, int? runeTargetKey)
    {
        var result = new List<NotificationItem>();
        if (snapshot == null) return result;
        if (_lastSnapshotAt == snapshot.CapturedAt) return result; // reemissao do heartbeat

        var firstRun = _lastSnapshotAt == null;
        _lastSnapshotAt = snapshot.CapturedAt;

        DetectLevelUps(snapshot, firstRun, result);
        DetectNewMaxStage(snapshot, firstRun, result);
        DetectChestsOverflow(snapshot, thresholds, firstRun, result);
        DetectRuneAffordable(snapshot, runeTargetKey, firstRun, result);

        return result;
    }

    private void DetectLevelUps(Snapshot s, bool firstRun, List<NotificationItem> result)
    {
        var levelUps = s.HeroEvents?.LevelUps;
        if (levelUps == null || levelUps.Count == 0) return;

        var newest = levelUps.Max(e => e.At);
        if (!firstRun)
        {
            foreach (var e in levelUps.Where(e => e.At > _lastLevelUpAt).OrderBy(e => e.At))
                result.Add(new NotificationItem(
                    NotificationCategory.LevelUp,
                    "Level up!",
                    $"{e.HeroName} subiu para o nivel {e.ToLevel}.",
                    e.At));
        }
        _lastLevelUpAt = Math.Max(_lastLevelUpAt, newest);
    }

    private void DetectNewMaxStage(Snapshot s, bool firstRun, List<NotificationItem> result)
    {
        var events = s.StageEvents?.Events;
        if (events == null || events.Count == 0) return;

        var newMaxes = events.Where(e => e.Kind == StageEventKind.NewMax).ToList();
        if (newMaxes.Count == 0) return;

        var newest = newMaxes.Max(e => e.At);
        if (!firstRun)
        {
            foreach (var e in newMaxes.Where(e => e.At > _lastStageEventAt).OrderBy(e => e.At))
                result.Add(new NotificationItem(
                    NotificationCategory.NewMaxStage,
                    "Novo estagio maximo",
                    $"Voce alcancou {e.ToLabel}.",
                    e.At));
        }
        _lastStageEventAt = Math.Max(_lastStageEventAt, newest);
    }

    private void DetectChestsOverflow(Snapshot s, BoxThresholds thresholds, bool firstRun, List<NotificationItem> result)
    {
        var total = s.Boxes?.Sum(b => b.Quantity) ?? 0;
        var level = Boxes.ClassifyBacklog(total, thresholds);

        if (!firstRun && _lastBoxLevel != null && BacklogRank(level) > BacklogRank(_lastBoxLevel))
        {
            if (level == "high")
                result.Add(new NotificationItem(
                    NotificationCategory.ChestsOverflow,
                    "Baus transbordando",
                    $"{total} baus acumulados — abra para nao desperdicar drops.",
                    s.CapturedAt));
            else if (level == "warn")
                result.Add(new NotificationItem(
                    NotificationCategory.ChestsOverflow,
                    "Baus acumulando",
                    $"{total} baus acumulados.",
                    s.CapturedAt));
        }
        _lastBoxLevel = level;
    }

    private void DetectRuneAffordable(Snapshot s, int? runeTargetKey, bool firstRun, List<NotificationItem> result)
    {
        if (runeTargetKey == null)
        {
            _lastRuneAffordable = null;
            _lastRuneTargetKey = null;
            return;
        }

        // Troca de alvo zera a linha de base (nao notifica na primeira leitura do novo alvo).
        var targetChanged = _lastRuneTargetKey != runeTargetKey;
        _lastRuneTargetKey = runeTargetKey;

        var plan = Runes.PlanRuneTarget(runeTargetKey.Value, s.Runes ?? new List<RuneLevel>(), s.Gold);
        var affordable = plan != null && plan.Reachable && !plan.AlreadyComplete && plan.GoldMissing <= 0;

        if (!firstRun && !targetChanged && _lastRuneAffordable == false && affordable)
            result.Add(new NotificationItem(
                NotificationCategory.RuneAffordable,
                "Runa-alvo disponivel",
                $"Voce ja tem ouro para {plan!.TargetName}.",
                s.CapturedAt));

        _lastRuneAffordable = affordable;
    }
}
