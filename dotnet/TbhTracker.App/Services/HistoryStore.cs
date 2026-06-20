using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TbhTracker.Core;

namespace TbhTracker.App.Services;

internal sealed class HistoryShape
{
    public int Version { get; set; } = 1;
    public Dictionary<string, Dictionary<string, JsonElement>> Saves { get; set; } = new();
}

/// <summary>Port de src/main/history.ts. Persiste o estado dos trackers num unico JSON,
/// isolado por save (sha1 curto do caminho). Escrita com debounce + flush ao fechar.</summary>
public sealed class HistoryStore
{
    private const int WriteDebounceMs = 2000;
    private readonly string _path;
    private readonly Lock _gate = new();
    private HistoryShape? _cache;
    private Timer? _writeTimer;

    public HistoryStore(string appDataDir)
    {
        _path = Path.Combine(appDataDir, "tbh-tracker-history.json");
    }

    private static string SaveKey(string savePath)
    {
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(savePath));
        return Convert.ToHexString(hash).ToLowerInvariant()[..16];
    }

    private HistoryShape Load()
    {
        if (_cache != null) return _cache;
        try
        {
            _cache = File.Exists(_path)
                ? JsonSerializer.Deserialize<HistoryShape>(File.ReadAllText(_path), Json.Options) ?? new()
                : new();
        }
        catch
        {
            _cache = new();
        }
        return _cache;
    }

    private void WriteNow()
    {
        lock (_gate)
        {
            _writeTimer?.Dispose();
            _writeTimer = null;
            if (_cache == null) return;
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
                File.WriteAllText(_path, JsonSerializer.Serialize(_cache, Json.Options));
            }
            catch
            {
                // historico e melhor-esforco
            }
        }
    }

    private void ScheduleWrite()
    {
        lock (_gate)
        {
            if (_writeTimer != null) return;
            _writeTimer = new Timer(_ => WriteNow(), null, WriteDebounceMs, Timeout.Infinite);
        }
    }

    public T? LoadHistory<T>(string? savePath, string ns) where T : class
    {
        if (savePath == null) return null;
        var saves = Load().Saves;
        if (saves.TryGetValue(SaveKey(savePath), out var bucket) && bucket.TryGetValue(ns, out var el))
        {
            try { return el.Deserialize<T>(Json.Options); }
            catch { return null; }
        }
        return null;
    }

    public void SaveHistory<T>(string? savePath, string ns, T data)
    {
        if (savePath == null) return;
        lock (_gate)
        {
            var h = Load();
            var key = SaveKey(savePath);
            if (!h.Saves.TryGetValue(key, out var bucket))
                h.Saves[key] = bucket = new();
            bucket[ns] = JsonSerializer.SerializeToElement(data, Json.Options);
        }
        ScheduleWrite();
    }

    public void Flush()
    {
        if (_writeTimer != null) WriteNow();
    }
}
