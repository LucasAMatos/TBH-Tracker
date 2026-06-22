using System.Text.RegularExpressions;
using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/shared/stage.ts (decode/rank/progress/levelAdvice).

public sealed class ActProgress
{
    public int Act { get; set; }
    public int Completed { get; set; }
    public int Total { get; set; }
}

public sealed class DifficultyProgress
{
    public int Difficulty { get; set; }
    public string DifficultyName { get; set; } = "";
    public int Completed { get; set; }
    public int Total { get; set; }
    public double Fraction { get; set; }
    public List<ActProgress> Acts { get; set; } = new();
}

public sealed class LevelAdvice
{
    public string StageRaw { get; set; } = "";
    public int? RecommendedLevel { get; set; }
    public double? AvgActiveLevel { get; set; }
    public int? MinActiveLevel { get; set; }
    public double? Delta { get; set; }
    public string Status { get; set; } = "unknown"; // under | ok | over | unknown
}

public static class Stages
{
    public static readonly Dictionary<int, string> DifficultyNames = new()
    {
        [1] = "Normal",
        [2] = "Nightmare",
        [3] = "Hell",
        [4] = "Torment"
    };

    private static readonly Regex StageRe = new(@"^\d{3,4}$", RegexOptions.Compiled);

    public static StageInfo? DecodeStage(string? value)
    {
        if (value == null) return null;
        var digits = value.Trim();
        if (!StageRe.IsMatch(digits)) return null;

        var padded = digits.PadLeft(4, '0');
        var difficulty = padded[0] - '0';
        var act = padded[1] - '0';
        var phase = int.Parse(padded.Substring(2));

        if (difficulty < 1 || difficulty > 4 || act < 1 || act > 3 || phase < 1 || phase > 10)
            return null;

        var difficultyName = DifficultyNames.TryGetValue(difficulty, out var dn) ? dn : $"?{difficulty}";
        var isBoss = phase == 10;

        return new StageInfo
        {
            Raw = padded,
            Difficulty = difficulty,
            DifficultyName = difficultyName,
            Act = act,
            Phase = phase,
            IsBoss = isBoss,
            Label = $"{difficultyName} · Ato {act} · Fase {phase}{(isBoss ? " (boss)" : "")}"
        };
    }

    public static StageInfo? DecodeStage(double? value) =>
        value == null ? null : DecodeStage(((long)value.Value).ToString());

    public static string? DifficultyName(int difficulty) =>
        DifficultyNames.TryGetValue(difficulty, out var n) ? n : null;

    public static string? NormalizeStageKey(string? value)
    {
        if (value == null) return null;
        var digits = value.Trim();
        if (!StageRe.IsMatch(digits)) return null;
        return digits.PadLeft(4, '0');
    }

    public static StageDatum? StageDataForRaw(string? value)
    {
        var key = NormalizeStageKey(value);
        if (key == null) return null;
        return Catalog.Stages.Stages.TryGetValue(key, out var d) ? d : null;
    }

    private static double StageScore(StageDatum s, string metric, double maxGold, double maxExp)
    {
        if (metric == "gold") return s.GoldPerHP;
        if (metric == "exp") return s.ExpPerHP;
        var g = maxGold > 0 ? s.GoldPerHP / maxGold : 0;
        var e = maxExp > 0 ? s.ExpPerHP / maxExp : 0;
        return g + e;
    }

    public static List<StageDatum> RankStages(string metric, int? difficulty = null, int? limit = null, int MaxStage = 0)
    {
        var stages = Catalog.Stages.Stages.Values.AsEnumerable();
        if (MaxStage > 0)
            stages = stages.Where(x => x.Key <= MaxStage);
        if (difficulty != null) stages = stages.Where(s => s.Difficulty == difficulty);
        var list = stages.ToList();
        var maxGold = list.Count > 0 ? list.Max(s => s.GoldPerHP) : 0;
        var maxExp = list.Count > 0 ? list.Max(s => s.ExpPerHP) : 0;
        var ranked = list
            .OrderByDescending(s => StageScore(s, metric, maxGold, maxExp))
            .ToList();
        return limit != null ? ranked.Take(limit.Value).ToList() : ranked;
    }

    public static Dictionary<int, List<StageDatum>> StagesByDifficulty()
    {
        var outMap = new Dictionary<int, List<StageDatum>>();
        foreach (var s in Catalog.Stages.Stages.Values)
        {
            if (!outMap.TryGetValue(s.Difficulty, out var list))
                outMap[s.Difficulty] = list = new List<StageDatum>();
            list.Add(s);
        }
        foreach (var list in outMap.Values) list.Sort((a, b) => a.Key - b.Key);
        return outMap;
    }

    public static List<DifficultyProgress> StageProgress(string? maxValue)
    {
        var k = NormalizeStageKey(maxValue);
        var maxKey = k != null ? int.Parse(k) : 0;

        var byDifficulty = StagesByDifficulty();
        var outList = new List<DifficultyProgress>();
        for (var difficulty = 1; difficulty <= 4; difficulty++)
        {
            var stages = byDifficulty.TryGetValue(difficulty, out var s) ? s : new List<StageDatum>();
            var actMap = new Dictionary<int, ActProgress>();
            var completed = 0;
            foreach (var st in stages)
            {
                if (!actMap.TryGetValue(st.Act, out var act))
                    act = new ActProgress { Act = st.Act, Completed = 0, Total = 0 };
                act.Total += 1;
                if (st.Key <= maxKey)
                {
                    act.Completed += 1;
                    completed += 1;
                }
                actMap[st.Act] = act;
            }
            var total = stages.Count;
            outList.Add(new DifficultyProgress
            {
                Difficulty = difficulty,
                DifficultyName = DifficultyNames.TryGetValue(difficulty, out var dn) ? dn : $"?{difficulty}",
                Completed = completed,
                Total = total,
                Fraction = total > 0 ? (double)completed / total : 0,
                Acts = actMap.Values.OrderBy(a => a.Act).ToList()
            });
        }
        return outList;
    }

    public static StageDatum? StageDataForRaw(double? value) =>
        StageDataForRaw(value == null ? null : ((long)value.Value).ToString());

    private const int UnderLevelMargin = 3;
    private const int OverLevelMargin = 5;

    public static LevelAdvice ComputeLevelAdvice(string? stageRaw, IEnumerable<int> activeHeroLevels)
    {
        var raw = NormalizeStageKey(stageRaw) ?? "";
        var recommendedLevel = StageDataForRaw(stageRaw)?.Level;
        var levels = activeHeroLevels.Where(n => n > 0).ToList();
        double? avgActiveLevel = levels.Count > 0 ? levels.Average() : null;
        int? minActiveLevel = levels.Count > 0 ? levels.Min() : null;

        var status = "unknown";
        double? delta = null;
        if (recommendedLevel != null && avgActiveLevel != null)
        {
            delta = avgActiveLevel.Value - recommendedLevel.Value;
            if (delta <= -UnderLevelMargin) status = "under";
            else if (delta >= OverLevelMargin) status = "over";
            else status = "ok";
        }

        return new LevelAdvice
        {
            StageRaw = raw,
            RecommendedLevel = recommendedLevel,
            AvgActiveLevel = avgActiveLevel,
            MinActiveLevel = minActiveLevel,
            Delta = delta,
            Status = status
        };
    }
}
