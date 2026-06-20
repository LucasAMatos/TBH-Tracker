using System.Text.Json;
using System.Text.RegularExpressions;
using TbhTracker.Core.Models;

namespace TbhTracker.App.Services;

/// <summary>Port de src/main/news.ts. Busca patch notes/anuncios oficiais do TBH na Steam
/// News API. Postura passiva: apenas um GET HTTPS a servico publico da Steam. Cacheado 10min.</summary>
public sealed class NewsService
{
    private const int AppId = 3678970;
    private const string NewsUrl =
        "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/" +
        "?appid=3678970&count=15&maxlength=700&format=json";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);
    private const int SummaryMax = 320;

    private static readonly Dictionary<string, string> Entities = new()
    {
        ["&amp;"] = "&", ["&lt;"] = "<", ["&gt;"] = ">", ["&quot;"] = "\"",
        ["&#39;"] = "'", ["&apos;"] = "'", ["&nbsp;"] = " "
    };

    private readonly HttpClient _http;
    private NewsFeed? _cache;

    public NewsService(HttpClient? http = null)
    {
        _http = http ?? new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
        if (!_http.DefaultRequestHeaders.UserAgent.TryParseAdd("TBH-Tracker"))
            _http.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "TBH-Tracker");
    }

    private static long NowMs() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    private static string CleanContents(string raw)
    {
        var s = raw;
        s = Regex.Replace(s, @"\[img\][^[]*\[/img\]", "", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\[url=[^\]]*\]([\s\S]*?)\[/url\]", "$1", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\[/?[a-z][^\]]*\]", " ", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, "<[^>]+>", " ");
        foreach (var (ent, ch) in Entities) s = s.Replace(ent, ch);
        s = Regex.Replace(s, @"\s+", " ").Trim();
        if (s.Length > SummaryMax) s = s[..SummaryMax].TrimEnd() + "\u2026";
        return s;
    }

    private static NewsItem MapItem(JsonElement it)
    {
        string Str(string name) =>
            it.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : "";
        double Num(string name) =>
            it.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetDouble() : 0;

        var title = Str("title").Trim();
        var author = Str("author").Trim();
        var feedLabel = Str("feedlabel");
        if (string.IsNullOrEmpty(feedLabel)) feedLabel = Str("feedname");
        if (string.IsNullOrEmpty(feedLabel)) feedLabel = "Steam";

        return new NewsItem
        {
            Id = Str("gid"),
            Title = string.IsNullOrEmpty(title) ? "(sem titulo)" : title,
            Url = Str("url"),
            Author = string.IsNullOrEmpty(author) ? null : author,
            Summary = CleanContents(Str("contents")),
            Date = (long)(Num("date") * 1000),
            FeedLabel = feedLabel
        };
    }

    /// <summary>Busca o feed de atualizacoes (com cache). force ignora o cache.</summary>
    public async Task<NewsFeed> FetchNewsAsync(bool force = false)
    {
        if (!force && _cache != null && NowMs() - _cache.FetchedAt < CacheTtl.TotalMilliseconds)
            return _cache;
        try
        {
            using var resp = await _http.GetAsync(NewsUrl).ConfigureAwait(false);
            resp.EnsureSuccessStatusCode();
            var body = await resp.Content.ReadAsStringAsync().ConfigureAwait(false);
            using var doc = JsonDocument.Parse(body);

            var items = new List<NewsItem>();
            if (doc.RootElement.TryGetProperty("appnews", out var appnews)
                && appnews.TryGetProperty("newsitems", out var arr)
                && arr.ValueKind == JsonValueKind.Array)
                foreach (var it in arr.EnumerateArray())
                    items.Add(MapItem(it));

            _cache = new NewsFeed { FetchedAt = NowMs(), Items = items, Error = null };
            return _cache;
        }
        catch (Exception err)
        {
            return new NewsFeed
            {
                FetchedAt = NowMs(),
                Items = _cache?.Items ?? new List<NewsItem>(),
                Error = err.Message
            };
        }
    }
}
