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
    private static readonly Lazy<MeltDataModel> _melt = new(() => Load<MeltDataModel>("meltData.json"));
    private static readonly Lazy<AttributeDataModel> _attrs = new(() => Load<AttributeDataModel>("attributeData.json"));
    private static readonly Lazy<StageDataModel> _stages = new(() => Load<StageDataModel>("stageData.json"));
    private static readonly Lazy<List<HeroCatalogEntry>> _heroes = new(() => Load<List<HeroCatalogEntry>>("heroes.json"));
    private static readonly Lazy<LevelDataModel> _levels = new(() => Load<LevelDataModel>("levels.json"));
    private static readonly Lazy<List<PediaSection>> _pedia = new(() => Load<List<PediaSection>>("tbhpedia.json"));
    private static readonly Lazy<List<WidgetDef>> _widgets = new(() => Load<List<WidgetDef>>("dashboardWidgets.json"));

    // Corpus da TBHPedia (Epico W) — recursos em Data/pedia/<dominio>.json.
    private static readonly Lazy<PediaCorpus<PetEntry>> _pediaPets =
        new(() => Load<PediaCorpus<PetEntry>>("pedia.pets.json"));
    private static readonly Lazy<PediaCorpus<PediaHeroEntry>> _pediaHeroes =
        new(() => Load<PediaCorpus<PediaHeroEntry>>("pedia.heroes.json"));
    private static readonly Lazy<PediaRunesFile> _pediaRunes =
        new(() => Load<PediaRunesFile>("pedia.runes.json"));
    private static readonly Lazy<PediaCorpus<PediaEffectEntry>> _pediaEffects =
        new(() => Load<PediaCorpus<PediaEffectEntry>>("pedia.effects.json"));
    private static readonly Lazy<PediaCorpus<PediaMapStage>> _pediaMap =
        new(() => Load<PediaCorpus<PediaMapStage>>("pedia.map.json"));
    private static readonly Lazy<PediaCorpus<PediaChestEntry>> _pediaChests =
        new(() => Load<PediaCorpus<PediaChestEntry>>("pedia.chests.json"));

    public static RuneTreeData Runes => _runes.Value;
    public static StatDataModel Stats => _stats.Value;
    public static ItemDataModel Items => _items.Value;
    public static MeltDataModel Melt => _melt.Value;
    public static AttributeDataModel Attributes => _attrs.Value;
    public static StageDataModel Stages => _stages.Value;
    public static List<HeroCatalogEntry> Heroes => _heroes.Value;
    public static LevelDataModel Levels => _levels.Value;
    public static List<PediaSection> Pedia => _pedia.Value;
    public static List<WidgetDef> Widgets => _widgets.Value;
    public static PediaCorpus<PetEntry> PediaPets => _pediaPets.Value;
    public static PediaCorpus<PediaHeroEntry> PediaHeroes => _pediaHeroes.Value;
    public static PediaRunesFile PediaRunes => _pediaRunes.Value;
    public static PediaCorpus<PediaEffectEntry> PediaEffects => _pediaEffects.Value;
    public static PediaCorpus<PediaMapStage> PediaMap => _pediaMap.Value;
    public static PediaCorpus<PediaChestEntry> PediaChests => _pediaChests.Value;
}
