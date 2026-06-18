import { heroName } from '@shared/heroes'
import { decodeStage } from '@shared/stage'
import type { HeroSnapshot, Snapshot } from '@shared/types'

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

/** Baus: soma de BoxData.BoxQuantity (array por tipo de bau). */
function parseBoxes(player: Json): number | null {
  const boxData = pick(player, ['BoxData', 'boxData'])
  const qty = pick(boxData, ['BoxQuantity', 'boxQuantity'])
  if (Array.isArray(qty)) {
    const nums = qty.map(toNumber).filter((n): n is number => n !== null)
    if (nums.length) return nums.reduce((a, b) => a + b, 0)
    return 0
  }
  return toNumber(qty)
}

/**
 * Contador cumulativo de clears: aggregateSaveDatas, entrada {Type:15, SubKey:0}.
 * Validado por amostragem: incrementa +1 a cada estagio limpo (independente de waves).
 */
const CLEAR_AGG_TYPE = 15
const CLEAR_AGG_SUBKEY = 0
function parseClearCount(player: Json): number | null {
  const aggs = pick(player, ['aggregateSaveDatas', 'AggregateSaveDatas'])
  const entries = Array.isArray(aggs) ? aggs : isObj(aggs) ? Object.values(aggs) : []
  for (const entry of entries) {
    if (!isObj(entry)) continue
    const type = toNumber(pick(entry, ['Type', 'type']))
    const sub = toNumber(pick(entry, ['SubKey', 'subKey', 'Subkey']))
    if (type === CLEAR_AGG_TYPE && sub === CLEAR_AGG_SUBKEY) {
      return toNumber(pick(entry, ['Value', 'value']))
    }
  }
  return null
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

/** Constroi um snapshot tipado a partir do JSON ES3 ja descriptografado. */
export function parseSnapshot(root: Json, includeRaw = false): Snapshot {
  const player = extractPlayer(root)
  const common = (pick(player, ['commonSaveData', 'CommonSaveData']) ?? player) as Json

  const arrangedHeroKeys = parseArrangedHeroKeys(common)
  const cube = pick(player, ['cubeSaveLevelData', 'CubeSaveLevelData'])

  const playTime = toNumber(pick(common, ['playTime', 'PlayTime']))

  return {
    capturedAt: Date.now(),
    playTimeSeconds: playTime !== null ? Math.floor(playTime) : null,
    gold: parseGold(player),
    stage: decodeStage(pick(common, ['currentStageKey', 'CurrentStageKey']) as number | string),
    currentWave: toNumber(pick(common, ['currentStageWave', 'CurrentStageWave'])),
    maxCompletedStage: decodeStage(
      pick(common, ['maxCompletedStage', 'MaxCompletedStage']) as number | string
    ),
    cubeLevel: toNumber(pick(cube, ['Level', 'level'])),
    cubeExp: toNumber(pick(cube, ['Exp', 'exp'])),
    boxQuantity: parseBoxes(player),
    heroes: parseHeroes(player, arrangedHeroKeys),
    arrangedHeroKeys,
    clearCount: parseClearCount(player),
    raw: includeRaw ? player : undefined
  }
}
