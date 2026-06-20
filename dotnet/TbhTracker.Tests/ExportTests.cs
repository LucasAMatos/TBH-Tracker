using System.Text.Json;
using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.Tests;

public class ExportTests
{
    private static Snapshot FakeSnapshot() => new()
    {
        CapturedAt = 1_700_000_000_000,
        Gold = 12345,
        TotalKills = 999,
        PlayTimeSeconds = 3600,
        Stage = new StageInfo { Raw = "1101" },
        MaxCompletedStage = new StageInfo { Raw = "1109" },
        Heroes = new List<HeroSnapshot>(),
        Inventory = new InventorySummary { TotalItems = 0 },
        StageFarm = new StageFarm
        {
            CurrentStageRaw = "1101",
            TotalSeconds = 60,
            Entries = new List<StageFarmEntry>
            {
                new()
                {
                    StageRaw = "1101",
                    GoldGained = 600,
                    ExpGained = 120,
                    KillsGained = 20,
                    Seconds = 60,
                    Reads = 2,
                    GoldPerHour = 36000,
                    ExpPerHour = 7200,
                    Clears = 2,
                    ClearsPerHour = 120,
                    SecondsPerClear = 30,
                    GoldPerClear = 300,
                    ExpPerClear = 60,
                    LastAt = 1_700_000_000_000
                }
            }
        }
    };

    [Fact]
    public void ExportStamp_MatchesTimestampFormat() =>
        Assert.Matches(@"^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$",
            Export.ExportStamp(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()));

    [Fact]
    public void BuildSessionJson_SerializesMainFields()
    {
        using var doc = JsonDocument.Parse(Export.BuildSessionJson(FakeSnapshot()));
        var root = doc.RootElement;
        Assert.Equal(12345, root.GetProperty("gold").GetInt32());
        Assert.Equal(999, root.GetProperty("totalKills").GetInt32());
        Assert.Equal(1, root.GetProperty("stageFarm").GetProperty("entries").GetArrayLength());
        Assert.Equal(JsonValueKind.String, root.GetProperty("exportedAt").ValueKind);
    }

    [Fact]
    public void BuildFarmCsv_HeaderPlusOneRowPerStage()
    {
        var lines = Export.BuildFarmCsv(FakeSnapshot()).Split('\n');
        Assert.Contains("estagio", lines[0]);
        Assert.Contains("clears_por_hora", lines[0]);
        Assert.Equal(2, lines.Length);
        Assert.Contains("1-1", lines[1]);
        Assert.Contains("1101", lines[1]);
    }

    [Fact]
    public void BuildFarmCsv_HeaderOnlyWhenNoMeasurements()
    {
        var empty = new Snapshot { StageFarm = new StageFarm { Entries = new List<StageFarmEntry>() } };
        Assert.Single(Export.BuildFarmCsv(empty).Split('\n'));
    }
}
