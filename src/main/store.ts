import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app, safeStorage } from 'electron'
import {
  DEFAULT_BOX_THRESHOLDS,
  normalizeBoxThresholds,
  type BoxThresholds
} from '@shared/boxes'

interface PersistShape {
  // chave ES3 cifrada em base64 (via safeStorage do SO); nunca em texto puro
  encryptedKey?: string
  // chave em texto puro (fallback se o SO nao suporta cifragem)
  plainKey?: string
  savePathOverride?: string | null
  // limiares de alerta de acumulo de baus (calibraveis pelo usuario)
  boxBacklogWarn?: number
  boxBacklogHigh?: number
  // runa-alvo selecionada na aba Runas (R3); RuneKey do catalogo ou ausente
  runeTargetKey?: number | null
}

let cache: PersistShape | null = null

function configPath(): string {
  return join(app.getPath('userData'), 'tbh-tracker-config.json')
}

function load(): PersistShape {
  if (cache) return cache
  const path = configPath()
  try {
    if (existsSync(path)) {
      cache = JSON.parse(readFileSync(path, 'utf8')) as PersistShape
    } else {
      cache = {}
    }
  } catch {
    cache = {}
  }
  return cache
}

function save(data: PersistShape): void {
  cache = data
  const path = configPath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
}

export function getKey(): string | null {
  const data = load()
  if (data.encryptedKey && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(data.encryptedKey, 'base64'))
    } catch {
      // cai para plainKey abaixo
    }
  }
  return data.plainKey ?? null
}

export function setKey(key: string): void {
  const data = load()
  const trimmed = key.trim()
  if (!trimmed) {
    clearKey()
    return
  }
  if (safeStorage.isEncryptionAvailable()) {
    data.encryptedKey = safeStorage.encryptString(trimmed).toString('base64')
    delete data.plainKey
  } else {
    data.plainKey = trimmed
    delete data.encryptedKey
  }
  save(data)
}

export function clearKey(): void {
  const data = load()
  delete data.encryptedKey
  delete data.plainKey
  save(data)
}

export function hasKey(): boolean {
  return getKey() !== null
}

export function getSavePathOverride(): string | null {
  return load().savePathOverride ?? null
}

export function setSavePathOverride(path: string | null): void {
  const data = load()
  if (path) data.savePathOverride = path
  else delete data.savePathOverride
  save(data)
}

export function getBoxThresholds(): BoxThresholds {
  const data = load()
  return normalizeBoxThresholds({
    warn: data.boxBacklogWarn ?? DEFAULT_BOX_THRESHOLDS.warn,
    high: data.boxBacklogHigh ?? DEFAULT_BOX_THRESHOLDS.high
  })
}

export function setBoxThresholds(warn: number, high: number): BoxThresholds {
  const normalized = normalizeBoxThresholds({ warn, high })
  const data = load()
  data.boxBacklogWarn = normalized.warn
  data.boxBacklogHigh = normalized.high
  save(data)
  return normalized
}

export function getRuneTarget(): number | null {
  const key = load().runeTargetKey
  return typeof key === 'number' ? key : null
}

export function setRuneTarget(key: number | null): number | null {
  const data = load()
  if (typeof key === 'number' && Number.isFinite(key)) data.runeTargetKey = key
  else delete data.runeTargetKey
  save(data)
  return getRuneTarget()
}
