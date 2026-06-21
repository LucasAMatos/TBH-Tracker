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

// ── Dominio Herois (W2) ──────────────────────────────────────────────────────

public sealed class HeroStat
{
    public string Stat { get; set; } = "";
    public double Value { get; set; }
    public string Disp { get; set; } = "";
}

public sealed class HeroBaseAttack
{
    public string DamageType { get; set; } = "";
    public List<string> Delivery { get; set; } = new();
    public double Range { get; set; }
}

public sealed class HeroSkillActivation
{
    public string Type { get; set; } = "";
    public double? Value { get; set; }
}

// Um no da arvore de habilidades. Campos passivos e ativos convivem (opcionais).
public sealed class HeroTreeNode
{
    public string Kind { get; set; } = "";   // "passive" | "active"
    public int Key { get; set; }
    public string Icon { get; set; } = "";
    public int MaxLevel { get; set; }
    public int? RequiredPoint { get; set; }
    // passivo
    public string? Stat { get; set; }
    public string? Mod { get; set; }
    public string? PerPoint { get; set; }
    public string? Total { get; set; }
    public List<string>? LevelDisps { get; set; }
    // ativo
    public string? Name { get; set; }
    public string? DescTemplate { get; set; }
    public string? Desc { get; set; }
    public List<double>? LevelValues { get; set; }
    public bool? Pct { get; set; }
    public HeroSkillActivation? Activation { get; set; }
    public double? Cooldown { get; set; }
    public double? Duration { get; set; }
    public double? Charge { get; set; }
    public bool? Continuous { get; set; }
    public string? DamageType { get; set; }
    public List<string>? Delivery { get; set; }
    public double? Range { get; set; }
}

public sealed class HeroTreeTier
{
    public int Group { get; set; }
    public int Tier { get; set; }
    public int LevelGate { get; set; }
    public List<HeroTreeNode> Nodes { get; set; } = new();
}

public sealed class PediaHeroEntry
{
    public int Key { get; set; }
    public string Class { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string MainWeapon { get; set; } = "";
    public string SubWeapon { get; set; } = "";
    public bool IsDlc { get; set; }
    public int UnlockCost { get; set; }
    public string Icon { get; set; } = "";
    public string Art { get; set; } = "";
    public List<HeroStat> Stats { get; set; } = new();
    public HeroBaseAttack BaseAttack { get; set; } = new();
    public List<HeroTreeTier> Tree { get; set; } = new();
    public int MaxPoints { get; set; }
}

// ── Dominio Runas (W3) ───────────────────────────────────────────────────────

public sealed class PediaRuneLevel
{
    public int Level { get; set; }
    public string Value { get; set; } = "";
    public double Cost { get; set; }
}

public sealed class PediaRuneEntry
{
    public int Key { get; set; }
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public double X { get; set; }
    public double Y { get; set; }
    public int MaxLevel { get; set; }
    public List<int> Next { get; set; } = new();
    public List<int> PrevReq { get; set; } = new();
    public string Stat { get; set; } = "";
    public string Effect { get; set; } = "";
    public string Category { get; set; } = "";
    public bool IsUnlock { get; set; }
    public List<PediaRuneLevel> Levels { get; set; } = new();
    public double TotalCost { get; set; }
}

// Runas carregam metadados extra (edges + categorias), entao usam envelope proprio.
public sealed class PediaRunesFile
{
    public string Domain { get; set; } = "";
    public PediaProvenance Provenance { get; set; } = new();
    public List<PediaRuneEntry> Entries { get; set; } = new();
    public List<List<int>> Edges { get; set; } = new();
    public List<string> Categories { get; set; } = new();
}

// ── Dominio Efeitos de material (W4) ─────────────────────────────────────────

public sealed class EffectGroup
{
    public string Slot { get; set; } = "";
    public string Stat { get; set; } = "";
    public string Mod { get; set; } = "";
    public double Min { get; set; }
    public double Max { get; set; }
    public int MinTier { get; set; }
    public int MaxTier { get; set; }
    public string Disp { get; set; } = "";
    public int SlotOptions { get; set; }
    public double Chance { get; set; }
}

public sealed class PediaEffectEntry
{
    public int Key { get; set; }
    public string Name { get; set; } = "";
    public string Grade { get; set; } = "";
    public int GradeRank { get; set; }
    public string Icon { get; set; } = "";
    public string Category { get; set; } = "";   // DECORATION | ENGRAVING | INSCRIPTION
    public List<EffectGroup> Groups { get; set; } = new();
}

// ── Dominio Mapa/Estagios/Monstros (W5) ──────────────────────────────────────

public sealed class StageMonster
{
    public int Key { get; set; }
    public string Name { get; set; } = "";
    public double Count { get; set; }
}

public sealed class StageBoss
{
    public int Key { get; set; }
    public string Name { get; set; } = "";
}

public sealed class StageDrop
{
    public int ItemKey { get; set; }
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public string Grade { get; set; } = "";
    public string Source { get; set; } = "";   // monster | boss | soulstone
    public double? Rate { get; set; }
    public int? DropKey { get; set; }
}

public sealed class PediaMapStage
{
    public int Key { get; set; }
    public string Difficulty { get; set; } = "";
    public int Act { get; set; }
    public int StageNo { get; set; }
    public string Label { get; set; } = "";
    public string Type { get; set; } = "";
    public int Level { get; set; }
    public string Name { get; set; } = "";
    public List<StageMonster> Monsters { get; set; } = new();
    public StageBoss? Boss { get; set; }
    public List<StageDrop> Drops { get; set; } = new();
}

// ── Dominio Baus (W7) ────────────────────────────────────────────────────────

public sealed class ChestPoolEntry
{
    public string RewardType { get; set; } = "";
    public int RewardKey { get; set; }
    public double Weight { get; set; }
    public double Probability { get; set; }
}

public sealed class ChestPool
{
    public string Label { get; set; } = "";
    public double TotalWeight { get; set; }
    public List<ChestPoolEntry> Entries { get; set; } = new();
}

public sealed class ChestStage
{
    public string Label { get; set; } = "";
    public string Difficulty { get; set; } = "";
    public int Act { get; set; }
    public int StageNo { get; set; }
    public int Level { get; set; }
    public string Source { get; set; } = "";
}

public sealed class PediaChestEntry
{
    public int DropKey { get; set; }
    public string DropType { get; set; } = "";
    public List<ChestPool> Pools { get; set; } = new();
    public List<ChestStage> Stages { get; set; } = new();
    public int? GearLevelMin { get; set; }
    public int? GearLevelMax { get; set; }
}
