using TbhTracker.Core;

namespace TbhTracker.Tests;

// Prova do pipeline da TBHPedia (Epico W / W1): o corpus gerado pelo tooling Node
// (scripts/gen-pedia-pets.cjs) e embutido no Core e carregado pelo Catalog.
public class PediaCorpusTests
{
    [Fact]
    public void PetsCorpus_HasProvenanceAndEntries()
    {
        var corpus = Catalog.PediaPets;
        Assert.Equal("pets", corpus.Domain);
        Assert.Equal("taskbarherowiki.com", corpus.Provenance.Source);
        Assert.False(string.IsNullOrWhiteSpace(corpus.Provenance.FetchedAt));
        Assert.Equal(8, corpus.Entries.Count);
    }

    [Fact]
    public void PetsCorpus_KillMonsterPetsHaveFarmInfo()
    {
        var farmable = Catalog.PediaPets.Entries.Where(p => p.Unlock.Type == "KillMonster").ToList();
        Assert.NotEmpty(farmable);
        Assert.All(farmable, p =>
        {
            Assert.NotNull(p.Unlock.Farm);
            Assert.True(p.Unlock.Count > 0);
            Assert.False(string.IsNullOrWhiteSpace(p.Unlock.Farm!.StageName));
        });
    }

    [Fact]
    public void PetsCorpus_DlcPetsAreFlaggedWithoutFarm()
    {
        var dlc = Catalog.PediaPets.Entries.Where(p => p.Dlc).ToList();
        Assert.NotEmpty(dlc);
        Assert.All(dlc, p =>
        {
            Assert.Equal("DLC", p.Unlock.Type);
            Assert.Null(p.Unlock.Farm);
        });
    }

    [Fact]
    public void PetsCorpus_EveryPetHasAtLeastOneStat() =>
        Assert.All(Catalog.PediaPets.Entries, p => Assert.NotEmpty(p.Stats));

    // ── W2 Herois ──
    [Fact]
    public void HeroesCorpus_SixHeroesWithStatsAndTree()
    {
        var heroes = Catalog.PediaHeroes;
        Assert.Equal("heroes", heroes.Domain);
        Assert.Equal(6, heroes.Entries.Count);
        Assert.All(heroes.Entries, h =>
        {
            Assert.False(string.IsNullOrWhiteSpace(h.Name));
            Assert.NotEmpty(h.Stats);
            Assert.NotEmpty(h.Tree);
        });
    }

    [Fact]
    public void HeroesCorpus_HasActiveSkillsWithDescriptions()
    {
        var nodes = Catalog.PediaHeroes.Entries.SelectMany(h => h.Tree).SelectMany(t => t.Nodes);
        var active = nodes.Where(n => n.Kind == "active").ToList();
        Assert.NotEmpty(active);
        Assert.Contains(active, n => !string.IsNullOrWhiteSpace(n.Desc));
    }

    // ── W3 Runas ──
    [Fact]
    public void RunesCorpus_197RunesWithEdgesAndCategories()
    {
        var runes = Catalog.PediaRunes;
        Assert.Equal("runes", runes.Domain);
        Assert.Equal(197, runes.Entries.Count);
        Assert.NotEmpty(runes.Edges);
        Assert.NotEmpty(runes.Categories);
        Assert.All(runes.Entries, r => Assert.NotEmpty(r.Levels));
    }

    // ── W4 Efeitos ──
    [Fact]
    public void EffectsCorpus_79EffectsWithGroups()
    {
        var fx = Catalog.PediaEffects;
        Assert.Equal(79, fx.Entries.Count);
        Assert.All(fx.Entries, e => Assert.NotEmpty(e.Groups));
        Assert.Contains(fx.Entries, e => e.Category == "DECORATION");
    }

    // ── W5 Mapa/Estagios/Monstros ──
    [Fact]
    public void MapCorpus_120StagesWithMonsters()
    {
        var map = Catalog.PediaMap;
        Assert.Equal(120, map.Entries.Count);
        // A maioria dos estagios tem monstros; estagios de boss de ato so tem boss + drops.
        Assert.True(map.Entries.Count(s => s.Monsters.Count > 0) >= 100);
        Assert.Contains(map.Entries, s => s.Boss != null);
        Assert.All(map.Entries, s => Assert.NotEmpty(s.Drops));
    }

    // ── W7 Baus ──
    [Fact]
    public void ChestsCorpus_41ChestsWithPools()
    {
        var chests = Catalog.PediaChests;
        Assert.Equal(41, chests.Entries.Count);
        Assert.All(chests.Entries, c => Assert.NotEmpty(c.Pools));
    }
}
