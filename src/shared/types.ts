import type { BoxKind, BoxThresholds } from './boxes'
import type { RuneCategory } from './runeTree'

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

// Um passo do plano de compra até a runa-alvo (R3): subir um nó de fromLevel→toLevel.
export interface RuneTargetStep {
  key: number // RuneKey do nó
  name: string
  icon: string // nome do ícone (sem extensão)
  category: RuneCategory
  fromLevel: number // nível atual observado
  toLevel: number // nível a alcançar (pré-req: 1; alvo: maxLevel)
  goldCost: number // ouro para ir de fromLevel→toLevel (0 quando o custo não é ouro)
  payableInGold: boolean // false quando o custo do passo não é em ouro (soul stones)
  isTarget: boolean // true só no nó-alvo (os demais são pré-requisitos)
  affordable: boolean // dá pra comprar agora: custo acumulado na sequência ≤ ouro atual
}

// Plano de ouro até a runa-alvo (R3): caminho de menor custo + progresso.
export interface RuneTargetPlan {
  targetKey: number
  targetName: string
  targetIcon: string
  category: RuneCategory
  currentLevel: number // nível atual do alvo
  maxLevel: number // nível máximo do alvo
  reachable: boolean // existe caminho de pré-requisitos até a raiz
  alreadyComplete: boolean // o alvo já está no nível máximo
  steps: RuneTargetStep[] // pré-requisitos (raiz→alvo) + o próprio alvo, em ordem
  totalGoldCost: number // soma do ouro de todos os passos pendentes
  goldHave: number | null // ouro atual observado (null se sem leitura)
  goldMissing: number // max(0, totalGoldCost - goldHave)
  progress: number // 0..1 (ouro atual / custo total; 1 se já dá pra comprar)
  hasNonGold: boolean // algum passo custa soul stones (não-ouro)
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

// Onde uma instância de item está guardada no save (D3).
export type ItemLocation = 'equipped' | 'inventory' | 'stash' | 'trading' | 'loose'

export const ITEM_LOCATIONS: ItemLocation[] = [
  'equipped',
  'inventory',
  'stash',
  'trading',
  'loose'
]

export const ITEM_LOCATION_LABELS: Record<ItemLocation, string> = {
  equipped: 'Equipado',
  inventory: 'Inventário',
  stash: 'Stash',
  trading: 'Trade Ship',
  loose: 'Solto'
}

// Uma linha da matriz tipo × raridade: um tipo de gear com as contagens por raridade,
// quebradas por localização (para filtrar por inventário/stash/equipado na UI).
export interface InventoryRow {
  gearType: string // GearTypeId (ver shared/items.ts)
  label: string // rótulo PT do tipo
  category: string // GearCategory ('weapon' | 'offhand' | 'armor' | 'accessory')
  byLocation: Record<ItemLocation, number[]> // [local][raridade] = quantidade
  counts: number[] // soma por raridade (todas as localizações)
  total: number // total de itens desse tipo
}

// Distribuição do inventário por tipo × raridade (D3). gradeCount = nº de raridades;
// os arrays de contagem por raridade têm esse tamanho (índice = tier da raridade).
export interface InventorySummary {
  totalItems: number // todas as instâncias em itemSaveDatas
  gearCount: number // itens de equipamento (gear)
  materialCount: number // materiais
  boxCount: number // baús de fase guardados como item
  unknownCount: number // ItemKey fora do catálogo (datamine desatualizado)
  legendaryPlus: number // gear de raridade Legendary+ (vendável)
  gradeCount: number // nº de raridades (tamanho dos arrays por raridade)
  rows: InventoryRow[] // matriz tipo × raridade (apenas gear)
  locationTotals: Record<ItemLocation, number> // total de instâncias por localização
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
  inventory: InventorySummary | null // distribuição de itens por tipo × raridade (D3)
  goldFlow?: GoldFlow // fluxo de ouro da sessão (preenchido pelo Tracker, não pelo parser)
  heroEvents?: HeroEvents // level-ups da sessão (preenchido pelo Tracker, não pelo parser)
  stageEvents?: StageEvents // eventos de estágio da sessão (preenchido pelo Tracker)
  raw?: unknown // JSON bruto do save (modo debug/calibracao)
}

// Um anúncio/patch note vindo da Steam News API (N1).
export interface NewsItem {
  id: string // gid do anúncio na Steam
  title: string
  url: string // link para o anúncio completo
  author: string | null
  summary: string // conteúdo limpo (sem BBCode/HTML), truncado
  date: number // epoch ms da publicação
  feedLabel: string // canal de origem (ex.: "Community Announcements")
}

// Feed de atualizações do jogo (N1). items vazio + error preenchido em caso de falha.
export interface NewsFeed {
  fetchedAt: number // epoch ms da busca
  items: NewsItem[]
  error: string | null // mensagem amigável se a busca falhou
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

// Resultado da descoberta automática da chave ES3 nos arquivos do jogo.
//  found      = chave localizada e validada (já aplicada/persistida)
//  no-save    = não há save para validar a chave (abra o jogo uma vez)
//  no-game    = instalação do jogo (resources.assets) não localizada
//  not-found  = arquivos lidos, mas a chave não foi encontrada (layout mudou?)
//  cancelled  = usuário recusou no aviso
//  error      = falha de leitura
export type KeyFindStatus =
  | 'found'
  | 'no-save'
  | 'no-game'
  | 'not-found'
  | 'cancelled'
  | 'error'

export interface KeyFindResult {
  status: KeyFindStatus
  gamePath?: string | null // arquivo do jogo inspecionado (resources.assets)
  message?: string // detalhe amigável (erros)
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
  getRuneTarget(): Promise<number | null>
  setRuneTarget(key: number | null): Promise<number | null>
  getNews(force?: boolean): Promise<NewsFeed>
  openExternal(url: string): Promise<void>
  findKey(): Promise<KeyFindResult>
}

declare global {
  interface Window {
    tbh: TbhApi
  }
}
