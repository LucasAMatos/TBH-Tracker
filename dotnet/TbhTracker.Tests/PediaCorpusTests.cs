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
}
