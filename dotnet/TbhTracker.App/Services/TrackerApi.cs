using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;

namespace TbhTracker.App.Services;

/// <summary>Fachada unica para a UI Blazor (equivalente ao window.tbh do Electron).
/// Encapsula Tracker/ConfigStore/News/KeyFinder e as interacoes de plataforma
/// (FilePicker, salvar arquivo, abrir link externo, versao, consentimento).</summary>
public sealed class TrackerApi
{
    private readonly Tracker _tracker;
    private readonly ConfigStore _store;
    private readonly NewsService _news;
    private readonly KeyFinder _keyFinder;
    private readonly Locator _locator;
    private bool _started;

    /// <summary>Emitido a cada mudanca de estado (e no heartbeat).</summary>
    public event Action<TrackerState>? OnState
    {
        add => _tracker.OnState += value;
        remove => _tracker.OnState -= value;
    }

    public TrackerApi(Tracker tracker, ConfigStore store, NewsService news, KeyFinder keyFinder, Locator locator)
    {
        _tracker = tracker;
        _store = store;
        _news = news;
        _keyFinder = keyFinder;
        _locator = locator;
    }

    /// <summary>Inicia o tracker uma unica vez (idempotente).</summary>
    public void EnsureStarted()
    {
        if (_started) return;
        _started = true;
        _tracker.Start();
    }

    public TrackerState GetState() => _tracker.GetState();

    public string GetVersion()
    {
        try { return AppInfo.Current.VersionString; }
        catch { return "1.0.0"; }
    }

    public bool HasKey() => _store.HasKey();

    public TrackerState SetKey(string key)
    {
        _store.SetKey(key);
        return _tracker.Refresh();
    }

    public TrackerState SetSavePathOverride(string? path)
    {
        _store.SetSavePathOverride(path);
        return _tracker.Refresh();
    }

    public async Task<TrackerState> PickSaveFileAsync()
    {
        try
        {
            var result = await FilePicker.Default.PickAsync(new PickOptions
            {
                PickerTitle = "Selecione o SaveFile_Live.es3"
            });
            if (result != null)
                _store.SetSavePathOverride(result.FullPath);
        }
        catch
        {
            // cancelado ou indisponivel
        }
        return _tracker.Refresh();
    }

    public TrackerState Refresh() => _tracker.Refresh();

    public object? GetRawSave() => _tracker.ReadRawSave();

    public BoxThresholds GetBoxThresholds() => _store.GetBoxThresholds();
    public BoxThresholds SetBoxThresholds(int warn, int high) => _store.SetBoxThresholds(warn, high);

    public int? GetRuneTarget() => _store.GetRuneTarget();
    public int? SetRuneTarget(int? key) => _store.SetRuneTarget(key);

    public DashboardLayout GetDashboardLayout() => _store.GetDashboardLayout();
    public DashboardLayout SetDashboardLayout(DashboardLayout layout) => _store.SetDashboardLayout(layout);

    public Task<NewsFeed> GetNewsAsync(bool force = false) => _news.FetchNewsAsync(force);

    public async Task OpenExternalAsync(string url)
    {
        if (!string.IsNullOrWhiteSpace(url)
            && (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
        {
            try { await Launcher.Default.OpenAsync(url); } catch { /* ignora */ }
        }
    }

    /// <summary>Descoberta automatica da chave ES3. Pede consentimento ANTES de ler os
    /// arquivos do jogo. Nao devolve a chave a UI; ela vive so no store cifrado.</summary>
    public async Task<KeyFindResult> FindKeyAsync()
    {
        var savePath = _store.GetSavePathOverride() ?? _locator.LocateSave();
        if (string.IsNullOrEmpty(savePath) || !File.Exists(savePath))
            return new KeyFindResult { Status = KeyFindStatus.NoSave };

        var page = Application.Current?.Windows.FirstOrDefault()?.Page;
        var consent = page != null && await page.DisplayAlert(
            "Localizar a chave automaticamente",
            "Procurar a chave de descriptografia nos arquivos do jogo?\n\n" +
            "O TBH-Tracker vai LER (somente leitura) os arquivos de instalacao do jogo no disco " +
            "— em especial o \"resources.assets\", onde o Easy Save 3 guarda a senha do save — e " +
            "testa-la contra o seu save.\n\n" +
            "Isto NAO toca no processo nem na memoria do jogo, NAO injeta nada, NAO modifica " +
            "nenhum arquivo e NAO acessa a internet. A chave fica guardada localmente e cifrada.",
            "Continuar", "Cancelar");

        if (!consent) return new KeyFindResult { Status = KeyFindStatus.Cancelled };

        var result = _keyFinder.FindEs3Key(savePath);
        if (result.Status == KeyFindStatus.Found && !string.IsNullOrEmpty(result.Key))
        {
            _store.SetKey(result.Key);
            _tracker.Refresh();
        }
        return new KeyFindResult { Status = result.Status, GamePath = result.GamePath, Message = result.Message };
    }

    /// <summary>Salva texto num arquivo escolhido pelo usuario (Windows FileSavePicker).
    /// Retorna o caminho salvo ou null se cancelado/falhou.</summary>
    public async Task<string?> SaveTextFileAsync(string defaultName, string content)
    {
        return await PlatformFile.SaveTextAsync(defaultName, content);
    }
}
