// Catálogo dos 6 heróis (ver TBHPEDIA.md > Heróis). Keys observadas no save: 1x1.
// Stats são os valores BASE (nível 1) do datamine; escalam com nível no jogo.
export interface HeroBaseStats {
  hp: number
  atk: number
  crit: string // ex.: "2.5%"
  armor: number
  atkSpd: number
}

export interface HeroCatalogEntry {
  key: number
  name: string
  weapon: string
  role: string
  tier: string // S / A / B ...
  availability: string // Base / DLC grátis / DLC pago
  baseStats: HeroBaseStats
}

export const HERO_CATALOG: HeroCatalogEntry[] = [
  {
    key: 101,
    name: 'Knight',
    weapon: 'Espada/Escudo',
    role: 'Tank',
    tier: 'S',
    availability: 'Base',
    baseStats: { hp: 130, atk: 2, crit: '2.5%', armor: 45, atkSpd: 0.9 }
  },
  {
    key: 201,
    name: 'Ranger',
    weapon: 'Arco',
    role: 'DPS físico',
    tier: 'B',
    availability: 'Base',
    baseStats: { hp: 60, atk: 1, crit: '4%', armor: 8, atkSpd: 1.0 }
  },
  {
    key: 301,
    name: 'Sorcerer',
    weapon: 'Cajado',
    role: 'DPS AoE',
    tier: 'A',
    availability: 'Base',
    baseStats: { hp: 50, atk: 2, crit: '5%', armor: 5, atkSpd: 0.55 }
  },
  {
    key: 401,
    name: 'Priest',
    weapon: 'Cetro',
    role: 'Suporte/Cura',
    tier: 'S',
    availability: 'DLC grátis',
    baseStats: { hp: 95, atk: 1, crit: '2%', armor: 30, atkSpd: 0.9 }
  },
  {
    key: 501,
    name: 'Hunter',
    weapon: 'Besta',
    role: 'DPS tático',
    tier: 'S',
    availability: 'DLC pago',
    baseStats: { hp: 70, atk: 2, crit: '4.5%', armor: 15, atkSpd: 0.7 }
  },
  {
    key: 601,
    name: 'Slayer',
    weapon: 'Machado',
    role: 'Bruiser melee',
    tier: 'A',
    availability: 'DLC pago',
    baseStats: { hp: 115, atk: 2, crit: '2.5%', armor: 40, atkSpd: 0.7 }
  }
]

// Mapa heroKey -> nome, derivado do catálogo.
export const HERO_NAMES: Record<number, string> = Object.fromEntries(
  HERO_CATALOG.map((h) => [h.key, h.name])
)

export function heroName(key: number | string | null | undefined): string {
  const n = Number(key)
  return HERO_NAMES[n] ?? String(key ?? '?')
}

export function heroByKey(key: number | string | null | undefined): HeroCatalogEntry | undefined {
  const n = Number(key)
  return HERO_CATALOG.find((h) => h.key === n)
}
