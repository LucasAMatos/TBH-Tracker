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

// Um evento de mudança de ouro entre duas leituras consecutivas do save (G3).
export interface GoldEvent {
  at: number // epoch ms da leitura em que o ouro mudou
  delta: number // variação de ouro (com sinal) vs. a leitura anterior
  gold: number // ouro resultante após a mudança
}

// Fluxo de ouro da sessão atual (em memória, sem persistência — I6 é separado).
export interface GoldFlow {
  sessionStartAt: number // 1ª amostra de ouro da sessão (epoch ms)
  sessionStartGold: number
  currentGold: number
  netDelta: number // currentGold - sessionStartGold (com sinal)
  elapsedSeconds: number // tempo entre 1ª e última amostra de ouro
  sessionRatePerHour: number | null // taxa média da sessão (ouro/h); null se sem tempo
  windowRatePerHour: number | null // taxa na janela móvel; null se sem amostras suficientes
  windowSeconds: number // tamanho da janela móvel usada
  events: GoldEvent[] // eventos recentes (mais recente primeiro), limitados
}

// Um level-up de herói detectado entre duas leituras consecutivas do save (H2).
export interface LevelUpEvent {
  at: number // epoch ms da leitura em que o nível subiu
  heroKey: number | string
  heroName: string
  fromLevel: number // nível anterior
  toLevel: number // nível resultante
}

// Eventos de heróis da sessão atual (em memória, sem persistência — I6 é separado).
export interface HeroEvents {
  sessionStartAt: number // 1ª leitura com heróis na sessão (epoch ms)
  levelUps: LevelUpEvent[] // level-ups recentes (mais recente primeiro), limitados
}

// Um evento de progresso de estágio detectado entre duas leituras do save (S3).
export type StageEventKind =
  | 'stage-change' // o estágio atual (CurrentStageKey) mudou
  | 'new-max' // o estágio máximo concluído (MaxCompletedStage) avançou

export interface StageEvent {
  at: number // epoch ms da leitura em que o estágio mudou
  kind: StageEventKind
  fromRaw: string | null // código do estágio anterior (null na 1ª troca observada)
  toRaw: string // código do estágio resultante
  toLabel: string // rótulo legível do estágio resultante
}

// Eventos de estágio da sessão atual (em memória, sem persistência — I6 é separado).
export interface StageEvents {
  sessionStartAt: number // 1ª leitura com estágio na sessão (epoch ms)
  events: StageEvent[] // eventos recentes (mais recente primeiro), limitados
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
  goldFlow?: GoldFlow // fluxo de ouro da sessão (preenchido pelo Tracker, não pelo parser)
  heroEvents?: HeroEvents // level-ups da sessão (preenchido pelo Tracker, não pelo parser)
  stageEvents?: StageEvents // eventos de estágio da sessão (preenchido pelo Tracker)
  raw?: unknown // JSON bruto do save (modo debug/calibracao)
}

export interface TrackerState {
  status: ConnectionStatus
  savePath: string | null
  hasKey: boolean
  lastError: string | null
  snapshot: Snapshot | null
  // Heartbeat (A2): sinais de atividade enquanto o app está aberto.
  lastChangeAt: number | null // epoch ms da última mudança detectada no save
  heartbeatAt: number | null // epoch ms do último "pulso" do tracker (mesmo sem mudança)
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
