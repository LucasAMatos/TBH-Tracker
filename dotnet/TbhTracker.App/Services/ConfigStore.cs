using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TbhTracker.Core;
using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.App.Services;

public sealed class WindowState
{
    public double Width { get; set; }
    public double Height { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public bool Maximized { get; set; }
}

public sealed class NotificationSettings
{
    public bool ChestsOverflow { get; set; } = true;
    public bool LevelUp { get; set; } = true;
    public bool NewMaxStage { get; set; } = true;
    public bool RuneAffordable { get; set; } = true;

    public bool IsEnabled(NotificationCategory category) => category switch
    {
        NotificationCategory.ChestsOverflow => ChestsOverflow,
        NotificationCategory.LevelUp => LevelUp,
        NotificationCategory.NewMaxStage => NewMaxStage,
        NotificationCategory.RuneAffordable => RuneAffordable,
        _ => false
    };
}

internal sealed class PersistShape
{
    public string? EncryptedKey { get; set; }
    public string? PlainKey { get; set; }
    public string? SavePathOverride { get; set; }
    public int? BoxBacklogWarn { get; set; }
    public int? BoxBacklogHigh { get; set; }
    public int? RuneTargetKey { get; set; }
    public DashboardLayout? DashboardLayout { get; set; }
    public WindowState? WindowState { get; set; }
    public bool? NotifyChestsOverflow { get; set; }
    public bool? NotifyLevelUp { get; set; }
    public bool? NotifyNewMaxStage { get; set; }
    public bool? NotifyRuneAffordable { get; set; }
    public bool? MinimizeToTray { get; set; }
}

/// <summary>Port de src/main/store.ts. Config JSON em AppDataDirectory; chave ES3 cifrada
/// com DPAPI (ProtectedData) e fallback de texto puro (com import do plainKey legado).</summary>
public sealed class ConfigStore
{
    private readonly string _path;
    private PersistShape? _cache;

    public ConfigStore(string appDataDir)
    {
        _path = Path.Combine(appDataDir, "tbh-tracker-config.json");
    }

    private PersistShape Load()
    {
        if (_cache != null) return _cache;
        try
        {
            _cache = File.Exists(_path)
                ? JsonSerializer.Deserialize<PersistShape>(File.ReadAllText(_path), Json.Options) ?? new()
                : new();
        }
        catch
        {
            _cache = new();
        }
        return _cache;
    }

    private void Save(PersistShape data)
    {
        _cache = data;
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        File.WriteAllText(_path, JsonSerializer.Serialize(data, Json.Indented));
    }

    private static bool EncryptionAvailable => OperatingSystem.IsWindows();

    public string? GetKey()
    {
        var data = Load();
        if (!string.IsNullOrEmpty(data.EncryptedKey) && EncryptionAvailable)
        {
            try
            {
                var bytes = Convert.FromBase64String(data.EncryptedKey);
                var plain = ProtectedData.Unprotect(bytes, null, DataProtectionScope.CurrentUser);
                return Encoding.UTF8.GetString(plain);
            }
            catch
            {
                // cai para plainKey
            }
        }
        return data.PlainKey;
    }

    public void SetKey(string key)
    {
        var data = Load();
        var trimmed = key.Trim();
        if (string.IsNullOrEmpty(trimmed)) { ClearKey(); return; }
        if (EncryptionAvailable)
        {
            try
            {
                var enc = ProtectedData.Protect(Encoding.UTF8.GetBytes(trimmed), null, DataProtectionScope.CurrentUser);
                data.EncryptedKey = Convert.ToBase64String(enc);
                data.PlainKey = null;
            }
            catch
            {
                data.PlainKey = trimmed;
                data.EncryptedKey = null;
            }
        }
        else
        {
            data.PlainKey = trimmed;
            data.EncryptedKey = null;
        }
        Save(data);
    }

    public void ClearKey()
    {
        var data = Load();
        data.EncryptedKey = null;
        data.PlainKey = null;
        Save(data);
    }

    public bool HasKey() => GetKey() != null;

    public string? GetSavePathOverride() => Load().SavePathOverride;

    public void SetSavePathOverride(string? path)
    {
        var data = Load();
        data.SavePathOverride = string.IsNullOrEmpty(path) ? null : path;
        Save(data);
    }

    public BoxThresholds GetBoxThresholds()
    {
        var data = Load();
        return Boxes.NormalizeThresholds(
            data.BoxBacklogWarn ?? Boxes.DefaultThresholds.Warn,
            data.BoxBacklogHigh ?? Boxes.DefaultThresholds.High);
    }

    public BoxThresholds SetBoxThresholds(int warn, int high)
    {
        var normalized = Boxes.NormalizeThresholds(warn, high);
        var data = Load();
        data.BoxBacklogWarn = normalized.Warn;
        data.BoxBacklogHigh = normalized.High;
        Save(data);
        return normalized;
    }

    public int? GetRuneTarget() => Load().RuneTargetKey;

    public int? SetRuneTarget(int? key)
    {
        var data = Load();
        data.RuneTargetKey = key;
        Save(data);
        return GetRuneTarget();
    }

    private static List<string> NormalizeWidgetIds(IEnumerable<string>? ids)
    {
        if (ids == null) return new();
        var valid = new HashSet<string>(WidgetIds.All);
        var seen = new HashSet<string>();
        var outList = new List<string>();
        foreach (var id in ids)
            if (valid.Contains(id) && seen.Add(id)) outList.Add(id);
        return outList;
    }

    private static DashboardLayout NormalizeLayout(DashboardLayout? layout)
    {
        if (layout == null) return DashboardLayout.Default();
        return new DashboardLayout
        {
            Hidden = NormalizeWidgetIds(layout.Hidden),
            Collapsed = NormalizeWidgetIds(layout.Collapsed)
        };
    }

    public DashboardLayout GetDashboardLayout() => NormalizeLayout(Load().DashboardLayout);

    public DashboardLayout SetDashboardLayout(DashboardLayout layout)
    {
        var normalized = NormalizeLayout(layout);
        var data = Load();
        data.DashboardLayout = normalized;
        Save(data);
        return normalized;
    }

    public NotificationSettings GetNotificationSettings()
    {
        var data = Load();
        return new NotificationSettings
        {
            ChestsOverflow = data.NotifyChestsOverflow ?? true,
            LevelUp = data.NotifyLevelUp ?? true,
            NewMaxStage = data.NotifyNewMaxStage ?? true,
            RuneAffordable = data.NotifyRuneAffordable ?? true
        };
    }

    public NotificationSettings SetNotificationSettings(NotificationSettings settings)
    {
        var data = Load();
        data.NotifyChestsOverflow = settings.ChestsOverflow;
        data.NotifyLevelUp = settings.LevelUp;
        data.NotifyNewMaxStage = settings.NewMaxStage;
        data.NotifyRuneAffordable = settings.RuneAffordable;
        Save(data);
        return GetNotificationSettings();
    }

    public bool GetMinimizeToTray() => Load().MinimizeToTray ?? true;

    public bool SetMinimizeToTray(bool value)
    {
        var data = Load();
        data.MinimizeToTray = value;
        Save(data);
        return GetMinimizeToTray();
    }

    public WindowState? GetWindowState()
    {
        var w = Load().WindowState;
        if (w == null || w.Width <= 0 || w.Height <= 0) return null;
        return w;
    }

    public void SetWindowState(WindowState state)
    {
        var data = Load();
        data.WindowState = state;
        Save(data);
    }
}
