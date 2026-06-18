import { existsSync, readFileSync } from 'node:fs'
import { RunDetector } from './analytics'
import { decryptAndParseES3, Es3DecryptError } from './es3'
import { locateSave } from './locator'
import { parseSnapshot } from './parser'
import * as runsStore from './runsStore'
import * as store from './store'
import { SaveWatcher } from './watcher'
import type { RunRecord, TrackerState } from '@shared/types'

/** Intervalo de leitura do save (polling). */
const POLL_INTERVAL_MS = 120_000

export class Tracker {
  private watcher: SaveWatcher | null = null
  private readonly detector = new RunDetector()
  private state: TrackerState = {
    status: 'no-save',
    savePath: null,
    hasKey: false,
    lastError: null,
    snapshot: null
  }

  constructor(
    private readonly onUpdate: (state: TrackerState) => void,
    private readonly onRun: (run: RunRecord) => void
  ) {}

  getState(): TrackerState {
    return this.state
  }

  /** (Re)avalia caminho do save, inicia o watcher e faz uma leitura. */
  start(): void {
    const savePath = store.getSavePathOverride() ?? locateSave()
    this.state.savePath = savePath
    this.state.hasKey = store.hasKey()

    // Reancorar a detecção: a marcação de corridas recomeça no próximo clear.
    this.detector.reset()

    if (this.watcher) {
      this.watcher.stop()
      this.watcher = null
    }

    if (savePath && existsSync(savePath)) {
      this.watcher = new SaveWatcher(savePath, () => this.readSave(), POLL_INTERVAL_MS)
      this.watcher.start()
    } else {
      this.state.status = 'no-save'
      this.state.snapshot = null
      this.emit()
    }
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
      this.update({ status: 'monitoring', snapshot, lastError: null })

      for (const run of this.detector.process(snapshot)) {
        runsStore.addRun(run)
        this.onRun(run)
      }
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

  /** Reancora a detecção de corridas (ex.: ao limpar o histórico). */
  resetDetector(): void {
    this.detector.reset()
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
  }
}
