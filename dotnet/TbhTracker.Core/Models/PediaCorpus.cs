namespace TbhTracker.Core.Models;

// Corpus canonico da TBHPedia (Epico W). Cada dominio e um arquivo JSON embutido em
// Data/pedia/<dominio>.json com envelope de proveniencia + entradas tipadas.
// Esquema definido em docs/PEDIA-CORPUS.md (W0).

public sealed class PediaProvenance
{
    public string Source { get; set; } = "";     // host, ex.: "taskbarherowiki.com"
    public string SourceUrl { get; set; } = "";   // URL exata da coleta
    public string Lang { get; set; } = "";        // "en" | "pt"
    public string FetchedAt { get; set; } = "";   // ISO 8601
}

public sealed class PediaCorpus<T>
{
    public string Domain { get; set; } = "";
    public PediaProvenance Provenance { get; set; } = new();
    public List<T> Entries { get; set; } = new();
}

// ── Dominio Pets (prova do pipeline W1) ──────────────────────────────────────

public sealed class PetStat
{
    public string Stat { get; set; } = "";   // id do stat no jogo
    public string Disp { get; set; } = "";    // valor exibido, ex.: "+10%"
    public string Label { get; set; } = "";   // rotulo legivel
}

public sealed class PetFarm
{
    public string Label { get; set; } = "";   // ex.: "1-7"
    public int Act { get; set; }
    public int StageNo { get; set; }
    public string StageName { get; set; } = "";
    public double Share { get; set; }          // % de spawn do monstro no estagio
    public double Weight { get; set; }
    public int AlsoIn { get; set; }            // qtd de outros estagios com o monstro
}

public sealed class PetUnlock
{
    public string Type { get; set; } = "";     // "KillMonster" | "DLC"
    public int? MonsterKey { get; set; }
    public string? MonsterName { get; set; }
    public int? Count { get; set; }            // abates necessarios
    public string? Note { get; set; }          // ex.: "Supporter Pack"
    public PetFarm? Farm { get; set; }
}

public sealed class PetEntry
{
    public int Key { get; set; }
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public bool Dlc { get; set; }
    public List<PetStat> Stats { get; set; } = new();
    public PetUnlock Unlock { get; set; } = new();
}
