namespace TbhTracker.App.Services;

/// <summary>Resolve URLs dos PNGs em wwwroot/assets (heroes/runes/attributes) por chave/icone,
/// equivalente aos heroPortraits/runeIcons/attributeIcons do React. Retorna null quando o
/// arquivo nao existe, para a UI poder ocultar a imagem (paridade com o undefined do TS).</summary>
public static class AssetUrls
{
    private static readonly Lazy<HashSet<string>> Available = new(() =>
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        try
        {
            var root = Path.Combine(AppContext.BaseDirectory, "wwwroot", "assets");
            if (Directory.Exists(root))
                foreach (var f in Directory.EnumerateFiles(root, "*.png", SearchOption.AllDirectories))
                {
                    var rel = Path.GetRelativePath(Path.Combine(AppContext.BaseDirectory, "wwwroot"), f)
                        .Replace('\\', '/');
                    set.Add(rel);
                }
        }
        catch
        {
            // sem acesso ao FS: o caller assume que existe
        }
        return set;
    });

    private static string? Resolve(string folder, string? name)
    {
        if (string.IsNullOrEmpty(name)) return null;
        var rel = $"assets/{folder}/{name}.png";
        var have = Available.Value;
        if (have.Count == 0) return rel; // nao foi possivel enumerar: deixa o caller tentar
        return have.Contains(rel) ? rel : null;
    }

    public static string? HeroPortrait(object? key) => Resolve("heroes", key?.ToString());
    public static string? RuneIcon(string? icon) => Resolve("runes", icon);
    public static string? AttributeIcon(string? icon) => Resolve("attributes", icon);
}

