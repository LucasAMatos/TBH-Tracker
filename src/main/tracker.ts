import { existsSync, readFileSync } from 'node:fs'
import { decryptAndParseES3, Es3DecryptError } from './es3'
import { GoldFlowTracker } from './goldFlow'
import { locateSave } from './locator'
import { parseSnapshot } from './parser'
import { StageEventsTracker } from './stageEvents'
import * as store from './store'
import { SaveWatcher } from './watcher'
import type { TrackerState } from '@shared/types'

// Intervalo do heartbeat (A2): re-emite o estado mesmo sem mudança no save, para
// provar que o tracker está vivo e atualizar "tempo desde a última mudança".
const HEARTBEAT_MS = 5000

export class Tracker {
  private watcher: SaveWatcher | null = null
  private goldFlow = new GoldFlowTracker()
  private stageEvents = new StageEventsTracker()
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
    // Trocar de arquivo de save zera o fluxo de ouro (sessão nova).
    if (savePath !== this.trackedPath) {
      this.goldFlow.reset()
      this.stageEvents.reset()
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
      const snapshot = parseSnapshot(json, true)
      const flow = this.goldFlow.record(snapshot.capturedAt, snapshot.gold)
      if (flow) snapshot.goldFlow = flow
      const stageEvents = this.stageEvents.record(
        snapshot.capturedAt,
        snapshot.stage,
        snapshot.maxCompletedStage
      )
      if (stageEvents) snapshot.stageEvents = stageEvents
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
  }
}
