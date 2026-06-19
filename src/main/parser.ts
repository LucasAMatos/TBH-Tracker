import { BOX_TYPES, kindFromTypeValue, type BoxKind } from '@shared/boxes'
import { heroName } from '@shared/heroes'
import { classifyItem, GEAR_TYPES, GRADES } from '@shared/items'
import { decodeStage } from '@shared/stage'
import type {
  BoxCount,
  HeroSnapshot,
  InventoryRow,
  InventorySummary,
  ItemLocation,
  PetSnapshot,
  RuneLevel,
  Snapshot
} from '@shared/types'

type Json = unknown

function isObj(v: Json): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function toNumber(v: Json): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  if (isObj(v)) {
    for (const key of ['value', 'Value', 'Quantity', 'amount', 'Amount']) {
      if (key in v) {
        const n = toNumber(v[key])
        if (n !== null) return n
      }
    }
  }
  return null
}

/** Pega o primeiro campo presente dentre varios nomes (tolerante a casing/typos). */
function pick(obj: Json, names: string[]): Json {
  if (!isObj(obj)) return undefined
  for (const n of names) {
    if (n in obj) return obj[n]
  }
  return undefined
}

/** Normaliza listas que podem vir como array ou objeto indexado. */
function asArray(v: Json): Json[] {
  if (Array.isArray(v)) return v
  if (isObj(v)) return Object.values(v)
  return []
}

/** Desembrulha o wrapper ES3 {__type, value}. */
function unwrapEs3(node: Json): Json {
  if (isObj(node) && '__type' in node && 'value' in node) return node['value']
  return node
}

/**
 * O save do TBH e duplamente codificado: o ES3 guarda PlayerSaveData como uma
 * STRING JSON dentro de {__type, value}. Esta funcao retorna o objeto player ja
 * parseado, com fallbacks para outros formatos.
 */
export function extractPlayer(root: Json): Record<string, Json> {
  if (!isObj(root)) return {}
  let pd = unwrapEs3(root['PlayerSaveData'])
  if (typeof pd === 'string') {
    try {
      pd = JSON.parse(pd)
    } catch {
      /* mantem string */
    }
  }
  if (isObj(pd)) return pd
  // fallback: talvez o root ja seja o player (formato futuro/alterado)
  if ('commonSaveData' in root || 'CommonSaveData' in root) return root
  return {}
}

/** Ouro: currenySaveDatas (typo do jogo) / CurrencySaveDatas, entrada Key 100001. */
function parseGold(player: Json): number | null {
  const GOLD_KEY = 100001
  const list = pick(player, ['currenySaveDatas', 'currencySaveDatas', 'CurrencySaveDatas'])
  const entries = Array.isArray(list) ? list : isObj(list) ? Object.values(list) : []
  for (const entry of entries) {
    if (!isObj(entry)) continue
    const key = toNumber(pick(entry, ['Key', 'key', 'CurrencyKey', 'Id', 'id']))
    if (key === GOLD_KEY) {
      const q = toNumber(pick(entry, ['Quantity', 'Value', 'value', 'Amount', 'amount']))
      if (q !== null) return q
    }
  }
  return null
}

/**
 * Total de kills cumulativo da conta, de `aggregateSaveDatas[]` (estatisticas
 * {Type, SubKey, Value}, validado em save real): entrada com Type 0 e SubKey 0.
 * Base do F1 (clears estimados = delta de kills / inimigos-por-clear do catalogo).
 * Retorna null quando o save nao expoe a estrutura (patch novo etc.).
 */
function parseTotalKills(player: Json): number | null {
  const list = pick(player, ['aggregateSaveDatas', 'AggregateSaveDatas'])
  const arr = asArray(list)
  for (const entry of arr) {
    if (!isObj(entry)) continue
    const type = toNumber(pick(entry, ['Type', 'type']))
    const subKey = toNumber(pick(entry, ['SubKey', 'subKey']))
    if (type === 0 && subKey === 0) {
      return toNumber(pick(entry, ['Value', 'value']))
    }
  }
  return null
}

/**
 * Baus por categoria. BoxData sao arrays PARALELOS (validado em save real):
 *   { BoxTypes:[...], BoxUniqueId:[...], BoxQuantity:[...] }
 * Cada indice i e um lote: tipo = BoxTypes[i], quantidade = BoxQuantity[i].
 * Agrupamos por categoria (Comum/Estagio/Ato) somando as quantidades; valores
 * de tipo desconhecidos sao ignorados (o jogo so tem estas tres categorias).
 * Retorna sempre as 3 categorias (0 quando nao ha baus) se BoxData existir.
 */
function parseBoxesByType(player: Json): BoxCount[] {
  const boxData = pick(player, ['BoxData', 'boxData'])
  const typesRaw = pick(boxData, ['BoxTypes', 'boxTypes'])
  if (!Array.isArray(typesRaw)) return []
  const qtyRaw = pick(boxData, ['BoxQuantity', 'boxQuantity'])
  const quantities = Array.isArray(qtyRaw) ? qtyRaw : []

  const sums = new Map<BoxKind, number>()
  typesRaw.forEach((t, i) => {
    const kind = kindFromTypeValue(Number(t))
    if (!kind) return
    sums.set(kind, (sums.get(kind) ?? 0) + (toNumber(quantities[i]) ?? 0))
  })

  return BOX_TYPES.map((meta) => ({
    kind: meta.kind,
    label: meta.label,
    quantity: sums.get(meta.kind) ?? 0
  }))
}

/** Total de baus nao abertos; null quando o save nao expoe BoxData. */
function totalBoxes(boxes: BoxCount[]): number | null {
  if (boxes.length === 0) return null
  return boxes.reduce((a, b) => a + b.quantity, 0)
}

/** Runas: RuneSaveData[] {RuneKey, Level}. Mantemos so os nos com nivel > 0. */
function parseRunes(player: Json): RuneLevel[] {
  const list = pick(player, ['RuneSaveData', 'runeSaveData', 'RuneSaveDatas'])
  const arr = Array.isArray(list) ? list : isObj(list) ? Object.values(list) : []
  const out: RuneLevel[] = []
  for (const entry of arr) {
    if (!isObj(entry)) continue
    const key = toNumber(pick(entry, ['RuneKey', 'runeKey', 'Key', 'key']))
    const level = toNumber(pick(entry, ['Level', 'level']))
    if (key === null || level === null || level <= 0) continue
    out.push({ key, level })
  }
  return out
}

// Pets do save (PE1): PetSaveData[] = { PetKey, IsUnlock }. O catálogo (nome/efeitos) vem
// de petData.ts; aqui só capturamos a key e se está desbloqueado.
function parsePets(player: Json): PetSnapshot[] {
  const arr = asArray(pick(player, ['PetSaveData', 'petSaveData', 'PetSaveDatas']))
  const out: PetSnapshot[] = []
  for (const entry of arr) {
    if (!isObj(entry)) continue
    const key = toNumber(pick(entry, ['PetKey', 'petKey', 'Key', 'key']))
    if (key === null) continue
    const unlocked = pick(entry, ['IsUnlock', 'IsUnLock', 'isUnlock']) === true
    out.push({ key, unlocked })
  }
  return out
}

function parseArrangedHeroKeys(common: Json): (number | string)[] {
  const arranged = pick(common, ['arrangedHeroKey', 'ArrangedHeroKey', 'ArrangedHeroKeys'])
  if (Array.isArray(arranged)) {
    // -1 / 0 = slot vazio
    return arranged.filter((v) => {
      const n = Number(v)
      return Number.isFinite(n) && n > 0
    }) as (number | string)[]
  }
  if (typeof arranged === 'number' && arranged > 0) return [arranged]
  return []
}

function parseHeroes(player: Json, activeKeys: (number | string)[]): HeroSnapshot[] {
  const list = pick(player, ['heroSaveDatas', 'HeroSaveDatas'])
  const arr = Array.isArray(list) ? list : isObj(list) ? Object.values(list) : []
  const activeSet = new Set(activeKeys.map((k) => String(k)))

  return arr
    .filter(isObj)
    .map((entry) => {
      const key =
        (pick(entry, ['heroKey', 'HeroKey', 'Key', 'key', 'Id']) as number | string) ?? ''
      return {
        key,
        name: heroName(key),
        level: toNumber(pick(entry, ['HeroLevel', 'Level', 'level'])),
        exp: toNumber(pick(entry, ['HeroExp', 'Exp', 'exp'])),
        unlocked: pick(entry, ['IsUnLock', 'IsUnlock', 'isUnlock']) === true,
        active: activeSet.has(String(key))
      }
    })
}

const ITEM_LOCATION_LIST: ItemLocation[] = [
  'equipped',
  'inventory',
  'stash',
  'trading',
  'loose'
]

function emptyLocationCounts(gradeCount: number): Record<ItemLocation, number[]> {
  const out = {} as Record<ItemLocation, number[]>
  for (const loc of ITEM_LOCATION_LIST) out[loc] = new Array(gradeCount).fill(0)
  return out
}

/**
 * Mapeia cada UniqueId de item à sua localização: equipado (em algum herói), stash,
 * inventário (mochila) ou Trade Ship. UniqueIds não encontrados ficam como 'loose'.
 * Os contêineres guardam slots {ItemUniqueId, Index}; heróis guardam equippedItemIds[].
 */
function buildItemLocationMap(player: Json): Map<string, ItemLocation> {
  const map = new Map<string, ItemLocation>()
  const set = (uid: Json, loc: ItemLocation): void => {
    if (uid === undefined || uid === null) return
    const s = String(uid)
    if (s === '' || s === '0' || s === '-1') return
    if (!map.has(s)) map.set(s, loc)
  }

  for (const hero of asArray(pick(player, ['heroSaveDatas', 'HeroSaveDatas']))) {
    const equipped = pick(hero, ['equippedItemIds', 'EquippedItemIds'])
    if (Array.isArray(equipped)) for (const u of equipped) set(u, 'equipped')
  }

  const markRows = (list: Json, loc: ItemLocation): void => {
    for (const row of asArray(list)) {
      set(pick(row, ['ItemUniqueId', 'itemUniqueId', 'UniqueId', 'uniqueId']), loc)
    }
  }
  markRows(pick(player, ['stashSaveDatas', 'StashSaveDatas']), 'stash')
  markRows(pick(player, ['inventorySaveDatas', 'InventorySaveDatas']), 'inventory')
  markRows(pick(player, ['tradingStashSaveDatas', 'TradingStashSaveDatas']), 'trading')

  return map
}

/**
 * Distribuição do inventário por tipo × raridade (D3). Junta cada instância de
 * `itemSaveDatas` (ItemKey → catálogo: tipo/raridade) à sua localização e monta a
 * matriz de gear por tipo e raridade, contando materiais/baús/desconhecidos à parte.
 */
function parseInventory(player: Json): InventorySummary | null {
  const items = asArray(pick(player, ['itemSaveDatas', 'ItemSaveDatas']))
  if (items.length === 0) return null

  const gradeCount = GRADES.length
  const locations = buildItemLocationMap(player)

  const rowByType = new Map<string, InventoryRow>()
  for (const meta of GEAR_TYPES) {
    rowByType.set(meta.id, {
      gearType: meta.id,
      label: meta.namePt,
      category: meta.category,
      byLocation: emptyLocationCounts(gradeCount),
      counts: new Array(gradeCount).fill(0),
      total: 0
    })
  }

  const locationTotals = {} as Record<ItemLocation, number>
  for (const loc of ITEM_LOCATION_LIST) locationTotals[loc] = 0

  let totalItems = 0
  let gearCount = 0
  let materialCount = 0
  let boxCount = 0
  let unknownCount = 0
  let legendaryPlus = 0

  for (const entry of items) {
    if (!isObj(entry)) continue
    totalItems++
    const uid = pick(entry, ['UniqueId', 'uniqueId', 'Id', 'id'])
    const loc = locations.get(String(uid)) ?? 'loose'
    locationTotals[loc]++

    const key = pick(entry, ['ItemKey', 'itemKey', 'Key', 'key'])
    const info = key === undefined ? null : classifyItem(key as number | string)
    if (!info) {
      unknownCount++
      continue
    }
    if (info.type === 'MATERIAL') {
      materialCount++
      continue
    }
    if (info.type === 'STAGEBOX') {
      boxCount++
      continue
    }

    gearCount++
    if (info.marketable) legendaryPlus++
    const tier = info.gradeTier
    const row = info.gearType ? rowByType.get(info.gearType) : undefined
    if (row && tier >= 0 && tier < gradeCount) {
      row.byLocation[loc][tier]++
      row.counts[tier]++
      row.total++
    }
  }

  return {
    totalItems,
    gearCount,
    materialCount,
    boxCount,
    unknownCount,
    legendaryPlus,
    gradeCount,
    rows: [...rowByType.values()].filter((r) => r.total > 0),
    locationTotals
  }
}

/** Constroi um snapshot tipado a partir do JSON ES3 ja descriptografado. */
export function parseSnapshot(root: Json, includeRaw = false): Snapshot {
  const player = extractPlayer(root)
  const common = (pick(player, ['commonSaveData', 'CommonSaveData']) ?? player) as Json

  const arrangedHeroKeys = parseArrangedHeroKeys(common)
  const cube = pick(player, ['cubeSaveLevelData', 'CubeSaveLevelData'])

  const playTime = toNumber(pick(common, ['playTime', 'PlayTime']))

  const boxes = parseBoxesByType(player)

  return {
    capturedAt: Date.now(),
    playTimeSeconds: playTime !== null ? Math.floor(playTime) : null,
    gold: parseGold(player),
    totalKills: parseTotalKills(player),
    stage: decodeStage(pick(common, ['currentStageKey', 'CurrentStageKey']) as number | string),
    currentWave: toNumber(pick(common, ['currentStageWave', 'CurrentStageWave'])),
    maxCompletedStage: decodeStage(
      pick(common, ['maxCompletedStage', 'MaxCompletedStage']) as number | string
    ),
    cubeLevel: toNumber(pick(cube, ['Level', 'level'])),
    cubeExp: toNumber(pick(cube, ['Exp', 'exp'])),
    boxQuantity: totalBoxes(boxes),
    boxes,
    heroes: parseHeroes(player, arrangedHeroKeys),
    arrangedHeroKeys,
    runes: parseRunes(player),
    pets: parsePets(player),
    inventory: parseInventory(player),
    raw: includeRaw ? player : undefined
  }
}
