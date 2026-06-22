namespace TbhTracker.Core.Models;

// Modelos dos catalogos estaticos (port das interfaces dos *Data.ts). Carregados de
// JSON embutido por Catalog.cs. Propriedades em PascalCase, mapeadas case-insensitive
// a partir das chaves camelCase do JSON.

// ── Runas (runeTree.ts) ──────────────────────────────────────────────────────

public sealed class RuneBounds
{
    public double MinX { get; set; }
    public double MaxX { get; set; }
    public double MinY { get; set; }
    public double MaxY { get; set; }
}

public sealed class RuneEdge
{
    public int From { get; set; }
    public int To { get; set; }
}

public sealed class RuneNode
{
    public int Key { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public string Stat { get; set; } = "";
    public string Category { get; set; } = "";
    public int MaxLevel { get; set; }
    public string Effect { get; set; } = "";
    public List<double> Values { get; set; } = new();
    public List<double> GoldCost { get; set; } = new();
}

public sealed class RuneTreeData
{
    public RuneBounds Bounds { get; set; } = new();
    public List<int> Start { get; set; } = new();
    public List<RuneEdge> Edges { get; set; } = new();
    public List<RuneNode> Nodes { get; set; } = new();
}

// ── Stats (statData.ts) ──────────────────────────────────────────────────────

public sealed class StatString
{
    public string Name { get; set; } = "";
    public string Line { get; set; } = "";
}

public sealed class AffixRep
{
    public double Value { get; set; }
    public string Mod { get; set; } = "";
    public int Tier { get; set; }
}

public sealed class GradeSlots
{
    public int Inherent { get; set; }
    public int Deco { get; set; }
    public int Engr { get; set; }
    public int Inscr { get; set; }
    public int Extra { get; set; }
}

public sealed class StatDataModel
{
    public List<string> StatIds { get; set; } = new();
    public List<string> ModTypes { get; set; } = new();
    public Dictionary<string, StatString> StatStrings { get; set; } = new();
    // valor = [statIdx, modTypeIdx, min, max]
    public Dictionary<string, double[]> StatMods { get; set; } = new();
    public Dictionary<string, AffixRep> AffixRep { get; set; } = new();
    public Dictionary<string, GradeSlots> GradeSlots { get; set; } = new();
}

// ── Itens (itemData.ts) ──────────────────────────────────────────────────────

public sealed class ItemDataModel
{
    public List<string> ItemTypeIds { get; set; } = new();
    public List<string> GearTypeIds { get; set; } = new();
    public List<string> GradeIds { get; set; } = new();
    // valor = [typeIdx, gearTypeIdx, gradeIdx, level]
    public Dictionary<string, int[]> Items { get; set; } = new();
}

// ── Derretimento / Alchemy (meltData.json, D5) ───────────────────────────────

public sealed class MeltDataModel
{
    // valor = [ouroVenda, xpCubo] por ItemKey (itemSell + itemCubeExp do datamine).
    public Dictionary<string, int[]> Items { get; set; } = new();
}

// ── Atributos (attributeData.ts) ─────────────────────────────────────────────

public sealed class AttrGroup
{
    public int Id { get; set; }
    public int X { get; set; }
}

public sealed class AttrNode
{
    public int Id { get; set; }
    public int Hero { get; set; }
    public int Grp { get; set; }
    public int Gx { get; set; }
    public string Kind { get; set; } = "";
    public int Max { get; set; }
    public int Req { get; set; }
    public string Icon { get; set; } = "";
    // passivo
    public string? St { get; set; }
    public string? Mt { get; set; }
    public double? V { get; set; }
    public string? Name { get; set; }
    public string? Line { get; set; }
    // ativo
    public int? SkillId { get; set; }
    public string? Act { get; set; }
    public string? Delivery { get; set; }
    public string? DmgType { get; set; }
    public double? Cd { get; set; }
    public List<double>? Dmg { get; set; }
}

public sealed class AttributeDataModel
{
    public List<AttrGroup> Groups { get; set; } = new();
    public List<AttrNode> Nodes { get; set; } = new();
}

// ── Estagios (stageData.ts) ──────────────────────────────────────────────────

public sealed class StageDatum
{
    public int Key { get; set; }
    public string Label { get; set; } = "";
    public int Difficulty { get; set; }
    public int Act { get; set; }
    public int Phase { get; set; }
    public int Level { get; set; }
    public string Name { get; set; } = "";
    public int Waves { get; set; }
    public int PerWave { get; set; }
    public int MonsterTypes { get; set; }
    public int Count { get; set; }
    public double TotalHP { get; set; }
    public double ExpectedGold { get; set; }
    public double ExpectedEXP { get; set; }
    public double GoldPerHP { get; set; }
    public double ExpPerHP { get; set; }
}

public sealed class StageDataModel
{
    public Dictionary<string, StageDatum> Stages { get; set; } = new();
}

// ── Curva de XP por nível (levels.json, H14) ─────────────────────────────────

public sealed class LevelDataModel
{
    // levels[i] = XP para subir do nível (i+1) para o (i+2); levels[0] = custo do 1→2.
    public List<double> Levels { get; set; } = new();
}

// ── Herois (heroes.ts) ───────────────────────────────────────────────────────

public sealed class HeroBaseStats
{
    public double Atk { get; set; }
    public double AtkSpd { get; set; }
    public double Crit { get; set; }
    public double CritDmg { get; set; }
    public double Hp { get; set; }
    public double Armor { get; set; }
    public double MoveSpd { get; set; }
    public double CastSpd { get; set; }
    public double Cdr { get; set; }
}

public sealed class HeroSkill
{
    public string Name { get; set; } = "";
    public string Kind { get; set; } = "";
    public int MaxLevel { get; set; }
}

public sealed class HeroTier
{
    public int Tier { get; set; }
    public int UnlockCost { get; set; }
    public bool? Locked { get; set; }
    public List<HeroSkill> Skills { get; set; } = new();
}

public sealed class HeroCatalogEntry
{
    public int Key { get; set; }
    public string Name { get; set; } = "";
    public string NamePt { get; set; } = "";
    public string Weapon { get; set; } = "";
    public string OffHand { get; set; } = "";
    public string Role { get; set; } = "";
    public string Tier { get; set; } = "";
    public string Availability { get; set; } = "";
    public string Unlock { get; set; } = "";
    public string Description { get; set; } = "";
    public double Dps { get; set; }
    public HeroBaseStats BaseStats { get; set; } = new();
    public List<HeroTier> SkillTree { get; set; } = new();
}

// ── TBHPedia (tbhpedia.ts) ───────────────────────────────────────────────────

public sealed class PediaTable
{
    public string? Caption { get; set; }
    public List<string> Headers { get; set; } = new();
    public List<List<string>> Rows { get; set; } = new();
}

public sealed class PediaSection
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Icon { get; set; } = "";
    public List<string>? Intro { get; set; }
    public List<PediaTable>? Tables { get; set; }
    public List<string>? Notes { get; set; }
    public string? Custom { get; set; }
}

// ── Dashboard widgets (dashboardWidgets.ts) ──────────────────────────────────

public sealed class WidgetDef
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public bool Collapsible { get; set; }
    public bool DefaultOn { get; set; }
}
