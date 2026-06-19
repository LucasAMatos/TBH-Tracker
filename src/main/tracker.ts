import { existsSync, readFileSync } from 'node:fs'
import { decryptAndParseES3, Es3DecryptError } from './es3'
import { GoldFlowTracker, type GoldFlowState } from './goldFlow'
import { HeroEventsTracker, type HeroEventsState } from './heroEvents'
import { flushHistory, loadHistory, saveHistory } from './history'
import { locateSave } from './locator'
import { parseSnapshot } from './parser'
import { StageEventsTracker, type StageEventsState } from './stageEvents'
import { StageFarmTracker, type StageFarmState } from './stageFarm'
import * as store from './store'
import { SaveWatcher } from './watcher'
import type { TrackerState } from '@shared/types'

// Intervalo do heartbeat (A2): re-emite o estado mesmo sem mudança no save, para
// provar que o tracker está vivo e atualizar "tempo desde a última mudança".
const HEARTBEAT_MS = 5000

export class Tracker {
  private watcher: SaveWatcher | null = null
  private goldFlow = new GoldFlowTracker()
  private heroEvents = new HeroEventsTracker()
  private stageEvents = new StageEventsTracker()
  private stageFarm = new StageFarmTracker()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private trackedPath: string | null = null
  private state: TrackerState = {
    status: 'no-save',
    savePath: null,
    hasKey: false,
    lastError: null,
    snapshot: null,
    lastChangeAt: null,
    heartbeatAt: null
  }

  constructor(private readonly onUpdate: (state: TrackerState) => void) {}

  getState(): TrackerState {
    return this.state
  }

  /** (Re)avalia caminho do save, inicia o watcher e faz uma leitura. */
  start(): void {
    const savePath = store.getSavePathOverride() ?? locateSave()
    // Trocar de arquivo de save recarrega o histórico persistido daquele save (I6):
    // o estado é isolado por caminho, então cada save retoma seus próprios eventos.
    if (savePath !== this.trackedPath) {
      this.goldFlow.restore(loadHistory<GoldFlowState>(savePath, 'goldFlow'))
      this.heroEvents.restore(loadHistory<HeroEventsState>(savePath, 'heroEvents'))
      this.stageEvents.restore(loadHistory<StageEventsState>(savePath, 'stageEvents'))
      this.stageFarm.restore(loadHistory<StageFarmState>(savePath, 'stageFarm'))
      this.trackedPath = savePath
    }
    this.state.savePath = savePath
    this.state.hasKey = store.hasKey()

    if (this.watcher) {
      this.watcher.stop()
      this.watcher = null
    }

    this.startHeartbeat()

    if (savePath && existsSync(savePath)) {
      this.watcher = new SaveWatcher(savePath, () => this.readSave())
      this.watcher.start()
    } else {
      this.state.status = 'no-save'
      this.state.snapshot = null
      this.emit()
    }
  }

  /** Heartbeat (A2): pulso periódico que re-emite o estado mesmo sem mudança no save. */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = setInterval(() => {
      this.state.heartbeatAt = Date.now()
      this.emit()
    }, HEARTBEAT_MS)
  }

  private readSave(): void {
    const savePath = this.state.savePath
    if (!savePath || !existsSync(savePath)) {
      this.update({ status: 'no-save', snapshot: null, lastError: null })
      return
    }

    const key = store.getKey()
    this.state.hasKey = key !== null
    if (!key) {
      this.update({ status: 'no-key', lastError: null })
      return
    }

    try {
      const buffer = readFileSync(savePath)
      const json = decryptAndParseES3(buffer, key)
      // I7: o snapshot NÃO carrega o JSON bruto (evita serializar o save inteiro a cada
      // leitura). O visualizador de calibração busca o raw sob demanda via readRawSave().
      const snapshot = parseSnapshot(json)
      const flow = this.goldFlow.record(snapshot.capturedAt, snapshot.gold)
      if (flow) snapshot.goldFlow = flow
      const heroEvents = this.heroEvents.record(snapshot.capturedAt, snapshot.heroes)
      if (heroEvents) snapshot.heroEvents = heroEvents
      const stageEvents = this.stageEvents.record(
        snapshot.capturedAt,
        snapshot.stage,
        snapshot.maxCompletedStage
      )
      if (stageEvents) snapshot.stageEvents = stageEvents
      // XP da conta = soma de HeroExp (proxy; reseta em level-up, mas deltas negativos
      // são ignorados pelo tracker — ver stageFarm.ts).
      const totalExp = snapshot.heroes.length
        ? snapshot.heroes.reduce((sum, h) => sum + (h.exp ?? 0), 0)
        : null
      const stageFarm = this.stageFarm.record(
        snapshot.capturedAt,
        snapshot.stage?.raw ?? null,
        snapshot.gold,
        totalExp,
        snapshot.totalKills
      )
      if (stageFarm) snapshot.stageFarm = stageFarm
      // Persiste o histórico desta leitura (I6, debounced por save).
      saveHistory(savePath, 'goldFlow', this.goldFlow.serialize())
      saveHistory(savePath, 'heroEvents', this.heroEvents.serialize())
      saveHistory(savePath, 'stageEvents', this.stageEvents.serialize())
      saveHistory(savePath, 'stageFarm', this.stageFarm.serialize())
      const now = Date.now()
      this.update({
        status: 'monitoring',
        snapshot,
        lastError: null,
        lastChangeAt: now,
        heartbeatAt: now
      })
    } catch (err) {
      const message =
        err instanceof Es3DecryptError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Erro desconhecido ao ler o save.'
      this.update({ status: 'error', lastError: message })
    }
  }

  refresh(): TrackerState {
    this.start()
    return this.state
  }

  /**
   * Lê o save agora e devolve só o JSON bruto do player (I7) — sob demanda, para o
   * visualizador de calibração. Não toca no estado/snapshot em curso. Retorna null se
   * não houver save/chave ou em caso de erro de leitura.
   */
  readRawSave(): unknown | null {
    const savePath = this.state.savePath
    if (!savePath || !existsSync(savePath)) return null
    const key = store.getKey()
    if (!key) return null
    try {
      const buffer = readFileSync(savePath)
      const json = decryptAndParseES3(buffer, key)
      return parseSnapshot(json, true).raw ?? null
    } catch {
      return null
    }
  }

  private update(patch: Partial<TrackerState>): void {
    this.state = { ...this.state, ...patch }
    this.emit()
  }

  private emit(): void {
    this.onUpdate(this.state)
  }

  stop(): void {
    this.watcher?.stop()
    this.watcher = null
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    // Garante que o histórico pendente (debounced) vá pro disco antes de fechar.
    flushHistory()
  }
}
