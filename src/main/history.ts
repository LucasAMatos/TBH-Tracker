import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'

// Camada de persistência de HISTÓRICO (I6), separada do config (`store.ts`).
// Guarda o estado serializado dos trackers (fluxo de ouro, level-ups, eventos de
// estágio) em um único JSON no userData, isolado por arquivo de save. Reutilizável:
// cada consumidor grava/lê no seu "namespace". Escrita com debounce (o save é lido a
// cada ~28s; coalescemos as gravações) + flush explícito ao parar/fechar.

const FILE = 'tbh-tracker-history.json'
const WRITE_DEBOUNCE_MS = 2000
const SCHEMA_VERSION = 1

export type HistoryNamespace = 'goldFlow' | 'heroEvents' | 'stageEvents' | 'stageFarm'

type SaveBucket = Partial<Record<HistoryNamespace, unknown>>

interface HistoryShape {
  version: number
  saves: Record<string, SaveBucket>
}

let cache: HistoryShape | null = null
let writeTimer: NodeJS.Timeout | null = null

function filePath(): string {
  return join(app.getPath('userData'), FILE)
}

// Isola o histórico por save: hash curto do caminho (saves diferentes não se misturam).
function saveKey(savePath: string): string {
  return createHash('sha1').update(savePath).digest('hex').slice(0, 16)
}

function load(): HistoryShape {
  if (cache) return cache
  try {
    const path = filePath()
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as HistoryShape
      cache = parsed && typeof parsed === 'object' && parsed.saves ? parsed : empty()
    } else {
      cache = empty()
    }
  } catch {
    cache = empty()
  }
  return cache
}

function empty(): HistoryShape {
  return { version: SCHEMA_VERSION, saves: {} }
}

function writeNow(): void {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  if (!cache) return
  try {
    const path = filePath()
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(cache), 'utf8')
  } catch {
    // Histórico é melhor-esforço: falha de disco não pode derrubar o tracker.
  }
}

function scheduleWrite(): void {
  if (writeTimer) return
  writeTimer = setTimeout(writeNow, WRITE_DEBOUNCE_MS)
}

/** Lê o estado persistido de um namespace para o save informado (ou null). */
export function loadHistory<T>(savePath: string | null, ns: HistoryNamespace): T | null {
  if (!savePath) return null
  const bucket = load().saves[saveKey(savePath)]
  return (bucket?.[ns] as T) ?? null
}

/** Grava (com debounce) o estado de um namespace para o save informado. */
export function saveHistory<T>(savePath: string | null, ns: HistoryNamespace, data: T): void {
  if (!savePath) return
  const h = load()
  const key = saveKey(savePath)
  const bucket = h.saves[key] ?? (h.saves[key] = {})
  bucket[ns] = data
  scheduleWrite()
}

/** Grava imediatamente o que estiver pendente (chamar ao parar/fechar o app). */
export function flushHistory(): void {
  if (writeTimer) writeNow()
}
