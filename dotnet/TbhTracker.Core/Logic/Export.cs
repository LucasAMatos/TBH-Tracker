using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/shared/export.ts.

public static class Export
{
    public static string BuildSessionJson(Snapshot snapshot)
    {
        var data = new
        {
            exportedAt = DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture),
            capturedAt = snapshot.CapturedAt,
            gold = snapshot.Gold,
            totalKills = snapshot.TotalKills,
            playTimeSeconds = snapshot.PlayTimeSeconds,
            stage = snapshot.Stage,
            maxCompletedStage = snapshot.MaxCompletedStage,
            heroes = snapshot.Heroes,
            goldFlow = snapshot.GoldFlow,
            stageFarm = snapshot.StageFarm,
            inventory = snapshot.Inventory
        };
        return JsonSerializer.Serialize(data, Json.Indented);
    }

    private static readonly Regex CsvSpecial = new("[\",\n\r]", RegexOptions.Compiled);

    private static string CsvField(string? value)
    {
        if (value == null) return "";
        return CsvSpecial.IsMatch(value) ? $"\"{value.Replace("\"", "\"\"")}\"" : value;
    }

    private static string CsvRow(IEnumerable<string?> fields) =>
        string.Join(",", fields.Select(CsvField));

    private static string IntOrEmpty(double? n) =>
        n == null ? "" : ((long)Math.Round(n.Value)).ToString(CultureInfo.InvariantCulture);

    private static string IntStr(double n) =>
        ((long)Math.Round(n)).ToString(CultureInfo.InvariantCulture);

    public static string BuildFarmCsv(Snapshot snapshot)
    {
        var header = new[]
        {
            "estagio", "estagio_raw", "segundos", "ouro_ganho", "xp_ganho", "kills",
            "ouro_por_hora", "xp_por_hora", "clears_estimados", "clears_por_hora", "segundos_por_clear"
        };
        var lines = new List<string> { CsvRow(header) };
        foreach (var e in snapshot.StageFarm?.Entries ?? new List<StageFarmEntry>())
        {
            var label = Stages.StageDataForRaw(e.StageRaw)?.Label ?? e.StageRaw;
            lines.Add(CsvRow(new[]
            {
                label,
                e.StageRaw,
                IntStr(e.Seconds),
                IntStr(e.GoldGained),
                IntStr(e.ExpGained),
                IntStr(e.KillsGained),
                IntOrEmpty(e.GoldPerHour),
                IntOrEmpty(e.ExpPerHour),
                IntOrEmpty(e.Clears),
                IntOrEmpty(e.ClearsPerHour),
                IntOrEmpty(e.SecondsPerClear)
            }));
        }
        return string.Join("\n", lines);
    }

    public static string ExportStamp(long? at = null)
    {
        var dto = at != null
            ? DateTimeOffset.FromUnixTimeMilliseconds(at.Value).LocalDateTime
            : DateTime.Now;
        string P(int n) => n.ToString("D2", CultureInfo.InvariantCulture);
        return $"{dto.Year}-{P(dto.Month)}-{P(dto.Day)}_{P(dto.Hour)}-{P(dto.Minute)}-{P(dto.Second)}";
    }
}
