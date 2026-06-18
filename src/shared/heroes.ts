// Catálogo dos 6 heróis (ver TBHPEDIA.md > Heróis e FONTES.md > TBH Wiki).
// Fonte: taskbarhero.wiki/pt/heroes/<slug> — stats base (nível 1, sem equipamento) e
// árvore de habilidades por tier (Planejador de build). Valores podem mudar com patches.
//
// Stats são os valores BASE (nível 1); escalam com nível, equipamento, runas e árvore.
// Todos os 9 atributos seguem "maior = melhor", o que permite calcular o ranking entre
// os 6 heróis em código (heroStatRank), em vez de fixar a posição manualmente.

export interface HeroBaseStats {
  atk: number // Dano de ataque
  atkSpd: number // Velocidade de ataque (ataques/s)
  crit: number // Chance crítica (%)
  critDmg: number // Dano crítico (%)
  hp: number // PV máx.
  armor: number // Armadura
  moveSpd: number // Velocidade de movimento
  castSpd: number // Velocidade de conjuração (multiplicador, 1.0 = 1.00×)
  cdr: number // Redução de recarga (%)
}

export type SkillKind = 'passive' | 'active'

export interface HeroSkill {
  name: string
  kind: SkillKind
  maxLevel: number
}

export interface HeroTier {
  tier: number // 1..8
  unlockCost: number // pontos de habilidade para desbloquear (T1 = 0)
  locked?: boolean // tier ainda não disponível no jogo (T7/T8)
  skills: HeroSkill[]
}

export interface HeroCatalogEntry {
  key: number
  name: string // nome em inglês (chave usada no save/dashboard)
  namePt: string // nome em português (exibição)
  weapon: string // arma principal
  offHand: string // mão secundária
  role: string
  tier: string // tier de "força" S / A / B (curadoria, não confundir com tiers da árvore)
  availability: string // Base / DLC grátis / DLC pago
  unlock: string // condição de desbloqueio observada na wiki
  description: string
  dps: number // DPS base exibido na wiki (nível 1)
  baseStats: HeroBaseStats
  skillTree: HeroTier[]
}

const P = (name: string, maxLevel: number): HeroSkill => ({ name, kind: 'passive', maxLevel })
const A = (name: string, maxLevel: number): HeroSkill => ({ name, kind: 'active', maxLevel })

export const HERO_CATALOG: HeroCatalogEntry[] = [
  {
    key: 101,
    name: 'Knight',
    namePt: 'Cavaleiro',
    weapon: 'Espada',
    offHand: 'Escudo',
    role: 'Tanque',
    tier: 'S',
    availability: 'Base',
    unlock: 'Herói inicial',
    description: 'Lutador corpo a corpo resistente com forte defesa e escudo.',
    dps: 1.82,
    baseStats: { atk: 2, atkSpd: 0.9, crit: 2.5, critDmg: 140, hp: 130, armor: 45, moveSpd: 950, castSpd: 1.0, cdr: 0 },
    skillTree: [
      { tier: 1, unlockCost: 0, skills: [P('Aprimoramento de Dano de Ataque', 3), P('Aprimoramento de Vida', 8), A('Estocada Perfurante', 5), A('Investida do Escudo', 5)] },
      { tier: 2, unlockCost: 10, skills: [P('Aprimoramento de Armadura', 8), P('Aprimoramento de Reg. PV/s', 5), A('Golpe de Retribuição', 5)] },
      { tier: 3, unlockCost: 20, skills: [P('Aprimoramento de PV por Abate', 10), P('Aprimoramento de Chance de Bloqueio', 10), A('Campo de Égide', 5)] },
      { tier: 4, unlockCost: 30, skills: [P('Aprimoramento de Dano Físico', 10), P('Aprimoramento de Vida', 10), A('Lâmina Sagrada', 5)] },
      { tier: 5, unlockCost: 40, skills: [P('Redução de Recarga', 10), P('Aprimoramento de Reg. PV/s', 10), A('Vontade Inabalável', 5)] },
      { tier: 6, unlockCost: 50, skills: [P('Aprimoramento de PV por Abate', 10), P('Aprimoramento de Chance de Bloqueio', 10)] },
      { tier: 7, unlockCost: 60, locked: true, skills: [P('Aprimoramento de Velocidade de Ataque', 10), P('Aprimoramento de Todas as Resistências Elementares', 10)] },
      { tier: 8, unlockCost: 70, locked: true, skills: [P('Aprimoramento de Red. Dano', 10), P('Aprimoramento de Dano de Ataque', 10)] }
    ]
  },
  {
    key: 201,
    name: 'Ranger',
    namePt: 'Explorador',
    weapon: 'Arco',
    offHand: 'Flecha',
    role: 'DPS à distância',
    tier: 'B',
    availability: 'Base',
    unlock: 'Herói inicial',
    description: 'Arqueiro ágil especializado em ataques precisos à distância.',
    dps: 1.02,
    baseStats: { atk: 1, atkSpd: 1.0, crit: 4.0, critDmg: 150, hp: 60, armor: 8, moveSpd: 850, castSpd: 1.0, cdr: 0 },
    skillTree: [
      { tier: 1, unlockCost: 0, skills: [P('Aprimoramento de Dano de Ataque', 3), P('Aprimoramento de Velocidade de Ataque', 8), A('Tiro Rápido', 5), A('Tiro Disperso', 5)] },
      { tier: 2, unlockCost: 10, skills: [P('Aprimoramento de Chance Crítica', 8), P('Aprimoramento de Dano Crítico', 3), A('Chuva de Flechas', 5)] },
      { tier: 3, unlockCost: 20, skills: [P('Aprimoramento de Chance de Esquiva', 10), P('Aprimoramento de Dano de Projétil', 10), A('Surto Veloz', 5)] },
      { tier: 4, unlockCost: 30, skills: [P('Aprimoramento de Chance de Esquiva', 10), P('Aprimoramento de Velocidade de Ataque', 10), A('Flecha Perfurante', 5)] },
      { tier: 5, unlockCost: 40, skills: [P('Aprimoramento de Chance de Esquiva', 10), P('Aprimoramento de Vel. de Mov.', 10), A('Disparo Espetador', 5)] },
      { tier: 6, unlockCost: 50, skills: [P('Aprimoramento de Chance de Esquiva', 10), P('Aprimoramento de Roubo de Vida', 10)] },
      { tier: 7, unlockCost: 60, locked: true, skills: [P('Aprimoramento de Dano de Área', 10), P('Aprimoramento de Dano de Projétil', 10)] },
      { tier: 8, unlockCost: 70, locked: true, skills: [P('Aprimoramento de Chance de Esquiva', 10), P('Aprimoramento de Velocidade de Ataque', 10)] }
    ]
  },
  {
    key: 301,
    name: 'Sorcerer',
    namePt: 'Feiticeiro',
    weapon: 'Cajado',
    offHand: 'Orbe',
    role: 'Mago em área',
    tier: 'A',
    availability: 'Base',
    unlock: 'Herói inicial',
    description: 'Mago poderoso causando dano mágico devastador em área.',
    dps: 1.14,
    baseStats: { atk: 2, atkSpd: 0.55, crit: 5.0, critDmg: 165, hp: 50, armor: 5, moveSpd: 770, castSpd: 1.0, cdr: 0 },
    skillTree: [
      { tier: 1, unlockCost: 0, skills: [P('Aprimoramento de Dano de Ataque', 3), P('Redução de Recarga', 8), A('Bola de Fogo', 5), A('Orbe de Gelo', 5)] },
      { tier: 2, unlockCost: 10, skills: [P('Aprimoramento de Área de Efeito', 8), P('Aprimoramento de Chance Crítica', 3), A('Raio', 5)] },
      { tier: 3, unlockCost: 20, skills: [P('Aprimoramento de Dano de Fogo', 10), P('Aprimoramento de Dano de Frio', 10), A('Hidra de Chamas', 5)] },
      { tier: 4, unlockCost: 30, skills: [P('Aprimoramento de Dano de Raio', 10), P('Aprimoramento de Vida', 10), A('Nevasca', 5)] },
      { tier: 5, unlockCost: 40, skills: [P('Redução de Recarga', 10), P('Aprimoramento de Dano de Ataque', 10), A('Golpe Meteórico', 5)] },
      { tier: 6, unlockCost: 50, skills: [P('Aprimoramento de Velocidade de Conjuração', 10), P('Aprimoramento de Dano Crítico', 10)] },
      { tier: 7, unlockCost: 60, locked: true, skills: [P('Aprimoramento de Todas as Resistências Elementares', 10), P('Aprimoramento de Área de Efeito', 10)] },
      { tier: 8, unlockCost: 70, locked: true, skills: [P('Aprimoramento de Chance Crítica', 10), P('Redução de Recarga', 10)] }
    ]
  },
  {
    key: 401,
    name: 'Priest',
    namePt: 'Sacerdote',
    weapon: 'Cetro',
    offHand: 'Tomo',
    role: 'Curandeiro / Suporte',
    tier: 'S',
    availability: 'DLC grátis',
    unlock: 'Desbloqueio: 500',
    description: 'Um curandeiro sagrado que apoia os aliados com magia de restauração.',
    dps: 0.91,
    baseStats: { atk: 1, atkSpd: 0.9, crit: 2.0, critDmg: 140, hp: 95, armor: 30, moveSpd: 700, castSpd: 1.0, cdr: 0 },
    skillTree: [
      { tier: 1, unlockCost: 0, skills: [P('Aprimoramento de Dano de Ataque', 3), P('Aprimoramento de Vida', 8), A('Cura', 5), A('Bênção do Poder', 5)] },
      { tier: 2, unlockCost: 10, skills: [P('Aprimoramento de Armadura', 8), P('Aprimoramento de Abs. de Dano', 3), A('Ira dos Céus', 5)] },
      { tier: 3, unlockCost: 20, skills: [P('Redução de Recarga', 10), P('Aprimoramento de Cura', 10), A('Santuário', 5)] },
      { tier: 4, unlockCost: 30, skills: [P('Aprimoramento de Vida', 10), P('Aprimoramento de Abs. de Dano', 10), A('Bênção de Proteção', 5)] },
      { tier: 5, unlockCost: 40, skills: [P('Aprimoramento de Velocidade de Conjuração', 10), P('Aprimoramento de Chance de Bloqueio', 10), A('Ressurreição', 5)] },
      { tier: 6, unlockCost: 50, skills: [P('Aprimoramento de Dano Físico', 10), P('Aprimoramento de Todas as Resistências Elementares', 10)] },
      { tier: 7, unlockCost: 60, locked: true, skills: [P('Redução de Recarga', 10), P('Aprimoramento de Armadura', 10)] },
      { tier: 8, unlockCost: 70, locked: true, skills: [P('Aprimoramento de Área de Efeito', 10), P('Aprimoramento de Velocidade de Conjuração', 10)] }
    ]
  },
  {
    key: 501,
    name: 'Hunter',
    namePt: 'Caçador',
    weapon: 'Besta',
    offHand: 'Virote',
    role: 'Armadilheiro / Distância',
    tier: 'S',
    availability: 'DLC pago',
    unlock: 'Desbloqueio: 500',
    description: 'Um especialista tático usando armadilhas e flechas de besta.',
    dps: 1.43,
    baseStats: { atk: 2, atkSpd: 0.7, crit: 4.5, critDmg: 155, hp: 70, armor: 15, moveSpd: 750, castSpd: 1.0, cdr: 0 },
    skillTree: [
      { tier: 1, unlockCost: 0, skills: [P('Aprimoramento de Dano de Ataque', 3), P('Aprimoramento de Chance Crítica', 8), A('Virote Explosivo', 5), A('Virote de Gelo', 5)] },
      { tier: 2, unlockCost: 10, skills: [P('Aprimoramento de Dano Crítico', 8), P('Aprimoramento de Chance de Esquiva', 3), A('Recarga Rápida', 5)] },
      { tier: 3, unlockCost: 20, skills: [P('Aprimoramento de Dano de Fogo', 10), P('Aprimoramento de Dano de Frio', 10), A('Armadilha de Carga', 5)] },
      { tier: 4, unlockCost: 30, skills: [P('Redução de Recarga', 10), P('Aprimoramento de Vida', 10), A('Torre de Besta', 5)] },
      { tier: 5, unlockCost: 40, skills: [P('Aprimoramento de Dano Físico', 10), P('Aprimoramento de Chance Crítica', 10), A('Virote de Choque', 5)] },
      { tier: 6, unlockCost: 50, skills: [P('Aprimoramento de Dano de Ataque', 10), P('Aprimoramento de Área de Efeito', 10)] },
      { tier: 7, unlockCost: 60, locked: true, skills: [P('Aprimoramento de Dano de Raio', 10), P('Aprimoramento de Dano Crítico', 10)] },
      { tier: 8, unlockCost: 70, locked: true, skills: [P('Aprimoramento de Velocidade de Ataque', 10), P('Aprimoramento de PV por Acerto', 10)] }
    ]
  },
  {
    key: 601,
    name: 'Slayer',
    namePt: 'Matador',
    weapon: 'Machado',
    offHand: 'Machadinha',
    role: 'Berserker / Corpo a corpo',
    tier: 'A',
    availability: 'DLC pago',
    unlock: 'Desbloqueio: 500',
    description: 'Um berserker selvagem causando dano corpo a corpo devastador pela fúria.',
    dps: 1.43,
    baseStats: { atk: 2, atkSpd: 0.7, crit: 2.5, critDmg: 180, hp: 115, armor: 40, moveSpd: 850, castSpd: 1.0, cdr: 0 },
    skillTree: [
      { tier: 1, unlockCost: 0, skills: [P('Aprimoramento de Dano de Ataque', 3), P('Aprimoramento de Vida', 8), A('Salto Devastador', 5), A('Golpe Esmagador', 5)] },
      { tier: 2, unlockCost: 10, skills: [P('Aprimoramento de Área de Efeito', 8), P('Aprimoramento de PV por Abate', 3), A('Grito do Comandante', 5)] },
      { tier: 3, unlockCost: 20, skills: [P('Aprimoramento de Dano Físico', 10), P('Aprimoramento de Roubo de Vida', 10), A('Golpe no Chão', 5)] },
      { tier: 4, unlockCost: 30, skills: [P('Aprimoramento de Dano de Ataque', 10), P('Aprimoramento de Vida', 10), A('Giro de Machado', 5)] },
      { tier: 5, unlockCost: 40, skills: [P('Aprimoramento de Dano Crítico', 10), P('Aprimoramento de Dano Físico', 10), A('Sede de Sangue', 5)] },
      { tier: 6, unlockCost: 50, skills: [P('Aprimoramento de Dano de Área', 10), P('Aprimoramento de Área de Efeito', 10)] },
      { tier: 7, unlockCost: 60, locked: true, skills: [P('Aprimoramento de Vida', 10), P('Aprimoramento de Vel. de Mov.', 10)] },
      { tier: 8, unlockCost: 70, locked: true, skills: [P('Aprimoramento de Dano de Área', 10), P('Aprimoramento de Duração', 10)] }
    ]
  }
]

// Definição dos 9 atributos exibidos (ordem da wiki). Todos seguem "maior = melhor".
export interface HeroStatDef {
  key: keyof HeroBaseStats
  label: string
  format: (v: number) => string
}

export const HERO_STAT_DEFS: HeroStatDef[] = [
  { key: 'atk', label: 'Dano de ataque', format: (v) => String(v) },
  { key: 'atkSpd', label: 'Vel. de ataque', format: (v) => `${v.toFixed(2)}/s` },
  { key: 'crit', label: 'Chance crít.', format: (v) => `${v}%` },
  { key: 'critDmg', label: 'Dano crítico', format: (v) => `${v}%` },
  { key: 'hp', label: 'PV máx.', format: (v) => String(v) },
  { key: 'armor', label: 'Armadura', format: (v) => String(v) },
  { key: 'moveSpd', label: 'Vel. de movimento', format: (v) => String(v) },
  { key: 'castSpd', label: 'Vel. de conjuração', format: (v) => `${v.toFixed(2)}×` },
  { key: 'cdr', label: 'Red. recarga', format: (v) => `${v}%` }
]

// Mapa heroKey -> nome (inglês), derivado do catálogo. Usado pelo parser/dashboard.
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

// Ranking (1 = melhor) de um atributo entre os 6 heróis. Empates compartilham a posição
// (ranking de competição: 1,1,3,...). "Maior = melhor" para todos os 9 atributos.
export interface HeroStatRank {
  rank: number
  total: number
  best: boolean
}

export function heroStatRank(statKey: keyof HeroBaseStats, value: number): HeroStatRank {
  const values = HERO_CATALOG.map((h) => h.baseStats[statKey])
  const total = values.length
  const better = values.filter((v) => v > value).length
  const rank = better + 1
  return { rank, total, best: rank === 1 }
}
