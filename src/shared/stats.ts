// Helpers de consulta sobre o catálogo de bônus/atributos de itens (D4; dado puro em statData.ts).
// Base do U11 (filtro/seleção por status) e do futuro modelo de stats (H10/H11).
import {
  AFFIX_REP,
  GRADE_SLOTS,
  MOD_TYPES,
  STAT_IDS,
  STAT_MODS,
  STAT_STRINGS,
  type GradeSlots,
  type StatMod
} from './statData'

export type StatId = (typeof STAT_IDS)[number]
export type ModType = (typeof MOD_TYPES)[number]

// Um tipo de status para listas de seleção (U11): id canônico + rótulo + linha-template PT-BR.
export interface StatType {
  id: string
  name: string
  line: string
}

/** Rótulo curto PT-BR do status (ex.: "Armadura"); cai para o próprio id se desconhecido. */
export function statName(id: string): string {
  return STAT_STRINGS[id]?.name ?? id
}

/** Linha-template do status (ex.: "Armadura +{0}"); cai para "<id> +{0}". */
export function statLine(id: string): string {
  return STAT_STRINGS[id]?.line ?? `${id} +{0}`
}

/** Formata um número no padrão pt-BR (inteiro quando possível, senão até 2 casas). */
function fmtValue(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value)
}

/**
 * Preenche a linha do status com um valor (ex.: `formatStatLine('Armor', 35)` → "Armadura +35").
 * Substitui o template `{0}` da linha; se não houver `{0}`, anexa "+valor".
 */
export function formatStatLine(id: string, value: number): string {
  const line = statLine(id)
  const v = fmtValue(value)
  return line.includes('{0}') ? line.replace('{0}', v) : `${line} +${v}`
}

// Lista de status para seleção (U11), ordenada pelo rótulo PT-BR.
export const STAT_LIST: StatType[] = STAT_IDS.map((id) => ({
  id,
  name: statName(id),
  line: statLine(id)
})).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

// Um modificador rolável já resolvido (legível), derivado de STAT_MODS.
export interface ResolvedMod {
  key: string // "baseKey:level"
  statId: string
  modType: ModType
  min: number
  max: number
}

function resolveMod(key: string, mod: StatMod): ResolvedMod {
  const [statIdx, mtIdx, min, max] = mod
  return {
    key,
    statId: STAT_IDS[statIdx] ?? '?',
    modType: MOD_TYPES[mtIdx] ?? MOD_TYPES[0],
    min,
    max
  }
}

/** Todos os modificadores rolaveis de um status (ranges min/max por nível), ordenados por min. */
export function modsForStat(statId: string): ResolvedMod[] {
  const out: ResolvedMod[] = []
  for (const key of Object.keys(STAT_MODS)) {
    const mod = STAT_MODS[key]
    if (STAT_IDS[mod[0]] === statId) out.push(resolveMod(key, mod))
  }
  return out.sort((a, b) => a.min - b.min || a.max - b.max)
}

/** Faixa global (min/max) que um status pode rolar entre todos os seus modificadores. */
export function statRange(statId: string): { min: number; max: number } | null {
  const mods = modsForStat(statId)
  if (mods.length === 0) return null
  return {
    min: Math.min(...mods.map((m) => m.min)),
    max: Math.max(...mods.map((m) => m.max))
  }
}

/** Slots de afixo de uma raridade (quantos bônus o item comporta). */
export function gradeSlotsFor(grade: string): GradeSlots | null {
  return GRADE_SLOTS[grade] ?? null
}

/** Total de slots de afixo de uma raridade (soma dos tipos de slot). */
export function gradeSlotTotal(grade: string): number {
  const s = GRADE_SLOTS[grade]
  if (!s) return 0
  return s.inherent + s.deco + s.engr + s.inscr + s.extra
}

/** Representação/orçamento de afixo de um status (ou null se não catalogado). */
export function affixRep(statId: string): (typeof AFFIX_REP)[string] | null {
  return AFFIX_REP[statId] ?? null
}
