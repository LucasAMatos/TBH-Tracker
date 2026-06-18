// Catálogo de itens do TBH (ver TBHPEDIA.md > Itens & Raridades e FONTES.md).
// Liga o dado bruto de `itemData.ts` (gerado pelo datamine) a rótulos PT, categorias
// de slot e metadados de raridade — base da aba Inventário (D3) e da classificação por
// raridade (D2). Tipos/raridades podem mudar com patches; regenerar `itemData.ts`.

import { GEAR_TYPE_IDS, GRADE_IDS, ITEM_DATA, ITEM_TYPE_IDS } from './itemData'

export type ItemType = (typeof ITEM_TYPE_IDS)[number] // 'GEAR' | 'MATERIAL' | 'STAGEBOX'
export type GearTypeId = (typeof GEAR_TYPE_IDS)[number]
export type GradeId = (typeof GRADE_IDS)[number]

// Categoria de slot do gear (agrupa os tipos na matriz da aba Inventário).
export type GearCategory = 'weapon' | 'offhand' | 'armor' | 'accessory'

export const CATEGORY_LABELS: Record<GearCategory, string> = {
  weapon: 'Armas',
  offhand: 'Mão secundária',
  armor: 'Armadura',
  accessory: 'Acessórios'
}

export interface GradeMeta {
  id: GradeId
  namePt: string
  tier: number // 0 (Common) .. 9 (Cosmic)
  marketable: boolean // Legendary+ é vendável no Steam Market
  color: string // cor da raridade (usada na visualização)
}

// Ordem e nomes seguem GRADE_IDS (Common → Cosmic). Cores escolhidas para a UI.
const GRADE_META: Record<GradeId, { namePt: string; color: string }> = {
  COMMON: { namePt: 'Comum', color: '#9aa4b2' },
  UNCOMMON: { namePt: 'Incomum', color: '#4ade80' },
  RARE: { namePt: 'Raro', color: '#38bdf8' },
  LEGENDARY: { namePt: 'Lendário', color: '#f59e0b' },
  IMMORTAL: { namePt: 'Imortal', color: '#ef4444' },
  ARCANA: { namePt: 'Arcano', color: '#a855f7' },
  BEYOND: { namePt: 'Além', color: '#ec4899' },
  CELESTIAL: { namePt: 'Celestial', color: '#22d3ee' },
  DIVINE: { namePt: 'Divino', color: '#eab308' },
  COSMIC: { namePt: 'Cósmico', color: '#fb7185' }
}

// Primeira raridade vendável no Market (Legendary e acima).
export const MARKETABLE_TIER = GRADE_IDS.indexOf('LEGENDARY')

export const GRADES: GradeMeta[] = GRADE_IDS.map((id, tier) => ({
  id,
  namePt: GRADE_META[id].namePt,
  tier,
  marketable: tier >= MARKETABLE_TIER,
  color: GRADE_META[id].color
}))

export interface GearTypeMeta {
  id: GearTypeId
  namePt: string
  category: GearCategory
}

// Rótulo PT + categoria de cada tipo de gear. A ordem aqui define a ordem das linhas
// na matriz tipo × raridade (agrupada por categoria).
const GEAR_TYPE_META: Record<GearTypeId, { namePt: string; category: GearCategory }> = {
  SWORD: { namePt: 'Espada', category: 'weapon' },
  AXE: { namePt: 'Machado', category: 'weapon' },
  HATCHET: { namePt: 'Machadinha', category: 'weapon' },
  BOW: { namePt: 'Arco', category: 'weapon' },
  CROSSBOW: { namePt: 'Besta', category: 'weapon' },
  STAFF: { namePt: 'Cajado', category: 'weapon' },
  SCEPTER: { namePt: 'Cetro', category: 'weapon' },
  SHIELD: { namePt: 'Escudo', category: 'offhand' },
  ARROW: { namePt: 'Flecha', category: 'offhand' },
  BOLT: { namePt: 'Virote', category: 'offhand' },
  ORB: { namePt: 'Orbe', category: 'offhand' },
  TOME: { namePt: 'Tomo', category: 'offhand' },
  HELMET: { namePt: 'Elmo', category: 'armor' },
  ARMOR: { namePt: 'Armadura', category: 'armor' },
  GLOVES: { namePt: 'Luvas', category: 'armor' },
  BOOTS: { namePt: 'Botas', category: 'armor' },
  AMULET: { namePt: 'Amuleto', category: 'accessory' },
  EARING: { namePt: 'Brinco', category: 'accessory' },
  RING: { namePt: 'Anel', category: 'accessory' },
  BRACER: { namePt: 'Bracelete', category: 'accessory' }
}

const CATEGORY_ORDER: GearCategory[] = ['weapon', 'offhand', 'armor', 'accessory']

// Tipos de gear ordenados por categoria (ordem das linhas da matriz).
export const GEAR_TYPES: GearTypeMeta[] = GEAR_TYPE_IDS.map((id) => ({
  id,
  namePt: GEAR_TYPE_META[id]?.namePt ?? id,
  category: GEAR_TYPE_META[id]?.category ?? 'accessory'
})).sort((a, b) => {
  const c = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  return c !== 0 ? c : a.namePt.localeCompare(b.namePt, 'pt-BR')
})

export interface ItemInfo {
  key: number
  type: ItemType
  gearType: GearTypeId | null
  category: GearCategory | null
  grade: GradeId | null
  gradeTier: number // -1 quando o item não tem raridade
  level: number | null
  marketable: boolean
}

const gradeByTier = (tier: number): GradeMeta | undefined => GRADES[tier]

/**
 * Classifica um ItemKey do save: tipo (gear/material/baú), tipo de gear (slot),
 * raridade e nível. Retorna null para chaves desconhecidas (catálogo desatualizado).
 */
export function classifyItem(key: number | string): ItemInfo | null {
  const datum = ITEM_DATA[String(key)]
  if (!datum) return null
  const [typeIdx, gtIdx, gradeIdx, level] = datum
  const type = ITEM_TYPE_IDS[typeIdx] ?? null
  if (!type) return null
  const gearType = gtIdx >= 0 ? (GEAR_TYPE_IDS[gtIdx] ?? null) : null
  const grade = gradeByTier(gradeIdx)
  return {
    key: Number(key),
    type,
    gearType,
    category: gearType ? (GEAR_TYPE_META[gearType]?.category ?? null) : null,
    grade: grade?.id ?? null,
    gradeTier: gradeIdx,
    level: level >= 0 ? level : null,
    marketable: gradeIdx >= MARKETABLE_TIER
  }
}

export function gradeMetaById(id: GradeId): GradeMeta | undefined {
  return GRADES.find((g) => g.id === id)
}
