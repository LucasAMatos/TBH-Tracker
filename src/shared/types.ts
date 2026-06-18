import type { BoxKind, BoxThresholds } from './boxes'

export type ConnectionStatus =
  | 'monitoring' // chave + save OK, lendo
  | 'no-key' // falta a chave ES3
  | 'no-save' // save nao encontrado
  | 'error' // erro de leitura/descriptografia

export interface StageInfo {
  raw: string // ex.: "1101"
  difficulty: number // 1..4
  difficultyName: string
  act: number // 1..3
  phase: number // 1..10
  isBoss: boolean
  label: string // ex.: "Normal · Ato 1 · Fase 1"
}

// Nível observado de um nó da árvore de runas (apenas nós com nível > 0).
export interface RuneLevel {
  key: number // RuneKey (== key do catálogo runeTree)
  level: number
}

export interface HeroSnapshot {
  key: number | string
  name: string
  level: number | null
  exp: number | null
  unlocked: boolean
  active: boolean
}

// Baús não abertos de uma categoria (soma de BoxData.BoxQuantity por BoxTypes).
export interface BoxCount {
  kind: BoxKind // 'common' | 'stageBoss' | 'actBoss'
  label: string // "Comum" · "Estágio" · "Ato"
  quantity: number
}

export interface Snapshot {
  capturedAt: number // epoch ms da leitura
  playTimeSeconds: number | null
  gold: number | null
  stage: StageInfo | null
  currentWave: number | null
  maxCompletedStage: StageInfo | null
  cubeLevel: number | null
  cubeExp: number | null
  boxQuantity: number | null // total de baús não abertos (soma de todos os tipos)
  boxes: BoxCount[] // baús não abertos separados por tipo
  heroes: HeroSnapshot[]
  arrangedHeroKeys: (number | string)[]
  runes: RuneLevel[] // nós da árvore de runas com nível > 0
  raw?: unknown // JSON bruto do save (modo debug/calibracao)
}

export interface TrackerState {
  status: ConnectionStatus
  savePath: string | null
  hasKey: boolean
  lastError: string | null
  snapshot: Snapshot | null
}

// API exposta ao renderer via preload (window.tbh)
export interface TbhApi {
  getState(): Promise<TrackerState>
  getVersion(): Promise<string>
  setKey(key: string): Promise<TrackerState>
  hasKey(): Promise<boolean>
  setSavePathOverride(path: string | null): Promise<TrackerState>
  pickSaveFile(): Promise<TrackerState>
  refresh(): Promise<TrackerState>
  onState(cb: (state: TrackerState) => void): () => void
  getBoxThresholds(): Promise<BoxThresholds>
  setBoxThresholds(warn: number, high: number): Promise<BoxThresholds>
}

declare global {
  interface Window {
    tbh: TbhApi
  }
}
