namespace TbhTracker.App.Services;

/// <summary>Port de src/main/watcher.ts. Observa o save e dispara onChange so quando o
/// conteudo muda (fingerprint = tamanho + mtime), com debounce. 100% passivo (so metadados).</summary>
public sealed class SaveWatcher : IDisposable
{
    private readonly string _filePath;
    private readonly Action _onChange;
    private readonly int _debounceMs;

    private FileSystemWatcher? _watcher;
    private Timer? _pollTimer;
    private Timer? _debounceTimer;
    private (long Size, long Mtime)? _last;
    private readonly Lock _gate = new();

    public SaveWatcher(string filePath, Action onChange, int debounceMs = 300)
    {
        _filePath = filePath;
        _onChange = onChange;
        _debounceMs = debounceMs;
    }

    public void Start()
    {
        Stop();
        try
        {
            var dir = Path.GetDirectoryName(_filePath)!;
            var name = Path.GetFileName(_filePath);
            _watcher = new FileSystemWatcher(dir, name)
            {
                NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.FileName,
                EnableRaisingEvents = true
            };
            _watcher.Changed += (_, _) => HandleEvent();
            _watcher.Created += (_, _) => HandleEvent();
            _watcher.Renamed += (_, _) => HandleEvent();
        }
        catch
        {
            // se o watch nativo falhar, o polling abaixo cobre
        }
        _pollTimer = new Timer(_ => HandleEvent(), null, 2000, 2000);
        HandleEvent(force: true);
    }

    private void HandleEvent(bool force = false)
    {
        lock (_gate)
        {
            _debounceTimer?.Dispose();
            _debounceTimer = new Timer(_ =>
            {
                (long Size, long Mtime) fp;
                try
                {
                    var info = new FileInfo(_filePath);
                    if (!info.Exists) return;
                    fp = (info.Length, info.LastWriteTimeUtc.Ticks);
                }
                catch
                {
                    return;
                }
                var changed = force || _last == null
                    || _last.Value.Size != fp.Size || _last.Value.Mtime != fp.Mtime;
                if (changed)
                {
                    _last = fp;
                    _onChange();
                }
            }, null, _debounceMs, Timeout.Infinite);
        }
    }

    public void Stop()
    {
        lock (_gate)
        {
            _watcher?.Dispose();
            _watcher = null;
            _pollTimer?.Dispose();
            _pollTimer = null;
            _debounceTimer?.Dispose();
            _debounceTimer = null;
            _last = null;
        }
    }

    public void Dispose() => Stop();
}
