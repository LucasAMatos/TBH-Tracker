using System.Reflection;
using System.Text.Json;
using TbhTracker.Core.Models;

namespace TbhTracker.Core;

/// <summary>Carrega os catalogos estaticos (JSON embutido em Data/*.json) uma unica vez.
/// Substitui os *Data.ts; os geradores Node continuam sendo a fonte (datamine).</summary>
public static class Catalog
{
    private static T Load<T>(string file)
    {
        var asm = typeof(Catalog).Assembly;
        var resource = $"TbhTracker.Core.Data.{file}";
        using var stream = asm.GetManifestResourceStream(resource)
            ?? throw new InvalidOperationException($"Recurso embutido nao encontrado: {resource}");
        return JsonSerializer.Deserialize<T>(stream, Json.Options)
            ?? throw new InvalidOperationException($"Falha ao desserializar {file}");
    }

    private static readonly Lazy<RuneTreeData> _runes = new(() => Load<RuneTreeData>("runeTree.json"));
    private static readonly Lazy<StatDataModel> _stats = new(() => Load<StatDataModel>("statData.json"));
    private static readonly Lazy<ItemDataModel> _items = new(() => Load<ItemDataModel>("itemData.json"));
    private static readonly Lazy<AttributeDataModel> _attrs = new(() => Load<AttributeDataModel>("attributeData.json"));
    private static readonly Lazy<StageDataModel> _stages = new(() => Load<StageDataModel>("stageData.json"));
    private static readonly Lazy<List<HeroCatalogEntry>> _heroes = new(() => Load<List<HeroCatalogEntry>>("heroes.json"));
    private static readonly Lazy<List<PediaSection>> _pedia = new(() => Load<List<PediaSection>>("tbhpedia.json"));
    private static readonly Lazy<List<WidgetDef>> _widgets = new(() => Load<List<WidgetDef>>("dashboardWidgets.json"));

    // Corpus da TBHPedia (Epico W) — recursos em Data/pedia/<dominio>.json.
    private static readonly Lazy<PediaCorpus<PetEntry>> _pediaPets =
        new(() => Load<PediaCorpus<PetEntry>>("pedia.pets.json"));

    public static RuneTreeData Runes => _runes.Value;
    public static StatDataModel Stats => _stats.Value;
    public static ItemDataModel Items => _items.Value;
    public static AttributeDataModel Attributes => _attrs.Value;
    public static StageDataModel Stages => _stages.Value;
    public static List<HeroCatalogEntry> Heroes => _heroes.Value;
    public static List<PediaSection> Pedia => _pedia.Value;
    public static List<WidgetDef> Widgets => _widgets.Value;
    public static PediaCorpus<PetEntry> PediaPets => _pediaPets.Value;
}
