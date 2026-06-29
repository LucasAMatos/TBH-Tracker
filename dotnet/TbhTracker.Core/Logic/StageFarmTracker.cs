using System.Text.Json.Serialization;
using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/main/stageFarm.ts (com janela das ultimas N clears por estagio).

/// <summary>Uma amostra de farm: o ganho medido no intervalo entre duas leituras do save
/// enquanto o estagio ficou estavel.</summary>
public sealed class StageSample
{
    public double Gold { get; set; }
    public double Exp { get; set; }
    public double Kills { get; set; }
    public double Seconds { get; set; }
    public long At { get; set; }
}

public sealed class StageBucket
{
    public string StageRaw { get; set; } = "";
    public string CompKey { get; set; } = "";
    public List<string> CompHeroKeys { get; set; } = new();

    /// <summary>Amostras recentes do estagio (janela das ultimas N clears). As metricas sao
    /// recalculadas a partir daqui; amostras mais antigas sao descartadas.</summary>
    public List<StageSample> Samples { get; set; } = new();
    public long LastAt { get; set; }

    // --- Compat: campos do formato antigo (pre-janela), usados apenas para migrar no Restore.
    // Nao sao mais escritos (WhenWritingDefault os omite quando zerados).
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)] public double GoldGained { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)] public double ExpGained { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)] public double KillsGained { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)] public double Seconds { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)] public int Reads { get; set; }
}

public sealed class StageFarmState
{
    public Dictionary<string, StageBucket> Stages { get; set; } = new();
    public long? LastAt { get; set; }
    public string? LastStageRaw { get; set; }
    public string? LastCompKey { get; set; }
    public List<string> LastCompHeroKeys { get; set; } = new();
    public double? LastGold { get; set; }
    public double? LastExp { get; set; }
    public double? LastKills { get; set; }
}

public sealed class StageFarmTracker
{
    private const int MaxGapSeconds = 180;
    private const int MinSecondsForRate = 20;
    private const string UnknownCompKey = "unknown";
    private const int ClearOverheadSeconds = 12;

    // Janela: por estagio, considerar apenas as ultimas N clears medidas (o resto e descartado).
    private const int MaxClearsWindow = 10;

    private Dictionary<string, StageBucket> _stages = new();
    private long? _lastAt;
    private string? _lastStageRaw;
    private string? _lastCompKey;
    private List<string> _lastCompHeroKeys = new();
    private double? _lastGold;
    private double? _lastExp;
    private double? _lastKills;

    public void Reset()
    {
        _stages = new();
        _lastAt = null;
        _lastStageRaw = null;
        _lastCompKey = null;
        _lastCompHeroKeys = new();
        _lastGold = null;
        _lastExp = null;
        _lastKills = null;
    }

    public StageFarmState Serialize() => new()
    {
        Stages = _stages,
        LastAt = _lastAt,
        LastStageRaw = _lastStageRaw,
        LastCompKey = _lastCompKey,
        LastCompHeroKeys = _lastCompHeroKeys,
        LastGold = _lastGold,
        LastExp = _lastExp,
        LastKills = _lastKills
    };

    public void Restore(StageFarmState? state)
    {
        _stages = state?.Stages ?? new();
        var normalizedStages = new Dictionary<string, StageBucket>();

        // Migracao do formato antigo (acumulador unico) -> uma amostra inicial por estagio,
        // para nao perder o historico ja coletado ao subir a versao.
        foreach (var kv in _stages)
        {
            var b = kv.Value;
            var identity = ResolveBucketIdentity(kv.Key, b);
            if (IsIgnoredStage(identity.StageRaw))
                continue;

            b.StageRaw = identity.StageRaw;
            b.CompKey = identity.CompKey;
            b.CompHeroKeys = identity.CompHeroKeys;

            if (b.Samples.Count == 0
                && (b.KillsGained > 0 || b.GoldGained > 0 || b.ExpGained > 0 || b.Seconds > 0))
            {
                b.Samples.Add(new StageSample
                {
                    Gold = b.GoldGained,
                    Exp = b.ExpGained,
                    Kills = b.KillsGained,
                    Seconds = b.Seconds,
                    At = b.LastAt
                });
                b.GoldGained = b.ExpGained = b.KillsGained = b.Seconds = 0;
                b.Reads = 0;
                Prune(b.StageRaw, b);
            }

            var normalizedKey = BucketKey(b.StageRaw, b.CompKey);
            if (normalizedStages.TryGetValue(normalizedKey, out var existing))
            {
                existing.Samples.AddRange(b.Samples);
                existing.LastAt = Math.Max(existing.LastAt, b.LastAt);
                Prune(existing.StageRaw, existing);
            }
            else
            {
                normalizedStages[normalizedKey] = b;
            }
        }
        _stages = normalizedStages;

        _lastAt = state?.LastAt;
        _lastStageRaw = state?.LastStageRaw;
        _lastCompKey = state?.LastCompKey ?? (state?.LastStageRaw != null ? UnknownCompKey : null);
        _lastCompHeroKeys = state?.LastCompHeroKeys ?? new();
        _lastGold = state?.LastGold;
        _lastExp = state?.LastExp;
        _lastKills = state?.LastKills;
    }

    public StageFarm? Record(
        long at,
        string? stageRaw,
        double? gold,
        double? totalExp,
        double? totalKills,
        IReadOnlyList<string>? arrangedHeroKeys = null)
    {
        var comp = BuildCompSignature(arrangedHeroKeys);
        if (IsIgnoredStage(stageRaw))
        {
            _lastAt = at;
            _lastStageRaw = stageRaw;
            _lastCompKey = comp.Key;
            _lastCompHeroKeys = comp.HeroKeys;
            if (gold != null) _lastGold = gold;
            if (totalExp != null) _lastExp = totalExp;
            if (totalKills != null) _lastKills = totalKills;
            return Current(stageRaw, comp.Key, comp.HeroKeys);
        }

        var canAttribute = _lastAt != null && _lastStageRaw != null
            && _lastCompKey != null
            && stageRaw != null && stageRaw == _lastStageRaw
            && comp.Key == _lastCompKey;

        if (canAttribute)
        {
            var dt = (at - _lastAt!.Value) / 1000.0;
            if (dt > 0 && dt <= MaxGapSeconds)
            {
                var bucket = Bucket(stageRaw!, comp.Key, comp.HeroKeys);
                bucket.Samples.Add(new StageSample
                {
                    Gold = gold != null && _lastGold != null ? Math.Max(0, gold.Value - _lastGold.Value) : 0,
                    Exp = totalExp != null && _lastExp != null ? Math.Max(0, totalExp.Value - _lastExp.Value) : 0,
                    Kills = totalKills != null && _lastKills != null ? Math.Max(0, totalKills.Value - _lastKills.Value) : 0,
                    Seconds = dt,
                    At = at
                });
                bucket.LastAt = at;
                Prune(stageRaw!, bucket);
            }
        }

        _lastAt = at;
        _lastStageRaw = stageRaw;
        _lastCompKey = comp.Key;
        _lastCompHeroKeys = comp.HeroKeys;
        if (gold != null) _lastGold = gold;
        if (totalExp != null) _lastExp = totalExp;
        if (totalKills != null) _lastKills = totalKills;

        return Current(stageRaw, comp.Key, comp.HeroKeys);
    }

    private StageBucket Bucket(string stageRaw, string compKey, List<string> compHeroKeys)
    {
        var key = BucketKey(stageRaw, compKey);
        if (!_stages.TryGetValue(key, out var b))
        {
            _stages[key] = b = new StageBucket
            {
                StageRaw = stageRaw,
                CompKey = compKey,
                CompHeroKeys = compHeroKeys
            };
        }
        return b;
    }

    private static (string Key, List<string> HeroKeys) BuildCompSignature(IReadOnlyList<string>? arrangedHeroKeys)
    {
        var heroKeys = (arrangedHeroKeys ?? Array.Empty<string>())
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k.Trim())
            .ToList();
        return heroKeys.Count == 0
            ? (UnknownCompKey, new List<string>())
            : (string.Join("|", heroKeys), heroKeys);
    }

    private static string BucketKey(string stageRaw, string compKey) => $"{stageRaw}::{compKey}";

    private static bool IsIgnoredStage(string? stageRaw) => Stages.DecodeStage(stageRaw)?.IsBoss == true;

    private static (string StageRaw, string CompKey, List<string> CompHeroKeys) ResolveBucketIdentity(string key, StageBucket bucket)
    {
        var stageRaw = bucket.StageRaw;
        var compKey = bucket.CompKey;

        if (string.IsNullOrEmpty(stageRaw))
        {
            var split = key.Split(new[] { "::" }, 2, StringSplitOptions.None);
            stageRaw = split[0];
            if (string.IsNullOrEmpty(compKey) && split.Length == 2)
                compKey = split[1];
        }

        if (string.IsNullOrEmpty(compKey))
            compKey = UnknownCompKey;

        var compHeroKeys = bucket.CompHeroKeys.Count > 0
            ? bucket.CompHeroKeys
            : (compKey == UnknownCompKey ? new List<string>() : compKey.Split('|').ToList());

        return (stageRaw, compKey, compHeroKeys);
    }

    /// <summary>Mantem apenas as amostras das ultimas <see cref="MaxClearsWindow"/> clears do
    /// estagio (clear = inimigos por clear do catalogo). Estagios fora do catalogo (sem essa
    /// contagem) caem para um limite por numero de amostras recentes.</summary>
    private static void Prune(string stageRaw, StageBucket b)
    {
        var perClear = Stages.StageDataForRaw(stageRaw)?.Count;
        if (perClear is > 0)
        {
            var maxKills = (double)MaxClearsWindow * perClear.Value;
            double acc = 0;
            int firstKeep = 0;
            for (int i = b.Samples.Count - 1; i >= 0; i--)
            {
                acc += b.Samples[i].Kills;
                if (acc >= maxKills) { firstKeep = i; break; }
            }
            if (firstKeep > 0) b.Samples.RemoveRange(0, firstKeep);
        }
        else if (b.Samples.Count > MaxClearsWindow)
        {
            b.Samples.RemoveRange(0, b.Samples.Count - MaxClearsWindow);
        }
    }

    private StageFarm? Current(string? currentStageRaw, string currentCompKey, List<string> currentCompHeroKeys)
    {
        var entries = _stages
            .Where(kv => kv.Value.Samples.Count > 0)
            .Select(kv =>
            {
                var identity = ResolveBucketIdentity(kv.Key, kv.Value);
                var stageRaw = identity.StageRaw;
                if (IsIgnoredStage(stageRaw)) return null;

                var samples = kv.Value.Samples;
                var gold = samples.Sum(s => s.Gold);
                var exp = samples.Sum(s => s.Exp);
                var kills = samples.Sum(s => s.Kills);
                var seconds = samples.Sum(s => s.Seconds);
                var rateOk = seconds >= MinSecondsForRate;
                var perClear = Stages.StageDataForRaw(stageRaw)?.Count;
                double? clears = perClear is > 0 ? kills / perClear.Value : null;
                var hasClears = clears != null && clears > 0;
                var adjustedSecondsPerClear = hasClears
                    ? Math.Max(0, (seconds / clears!.Value) - ClearOverheadSeconds)
                    : (double?)null;
                return new StageFarmEntry
                {
                    StageRaw = stageRaw,
                    CompKey = identity.CompKey,
                    CompHeroKeys = identity.CompHeroKeys,
                    GoldGained = Math.Round(gold),
                    ExpGained = Math.Round(exp),
                    KillsGained = Math.Round(kills),
                    Seconds = seconds,
                    Reads = samples.Count,
                    GoldPerHour = rateOk ? (gold / seconds) * 3600 : null,
                    ExpPerHour = rateOk ? (exp / seconds) * 3600 : null,
                    Clears = clears,
                    ClearsPerHour = rateOk && adjustedSecondsPerClear is > 0 ? 3600 / adjustedSecondsPerClear.Value : null,
                    SecondsPerClear = adjustedSecondsPerClear,
                    GoldPerClear = hasClears ? gold / clears!.Value : null,
                    ExpPerClear = hasClears ? exp / clears!.Value : null,
                    LastAt = samples[^1].At
                };
            })
            .Where(e => e != null)
            .Select(e => e!)
            .ToList();

        if (entries.Count == 0) return null;
        entries.Sort((a, b) => b.Seconds.CompareTo(a.Seconds));

        return new StageFarm
        {
            Entries = entries,
            TotalSeconds = entries.Sum(e => e.Seconds),
            CurrentStageRaw = currentStageRaw,
            CurrentCompKey = currentCompKey,
            CurrentCompHeroKeys = currentCompHeroKeys
        };
    }
}
