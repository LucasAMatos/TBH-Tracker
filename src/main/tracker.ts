import { existsSync, readFileSync } from 'node:fs'
import { decryptAndParseES3, Es3DecryptError } from './es3'
import { locateSave } from './locator'
import { parseSnapshot } from './parser'
import * as store from './store'
import { SaveWatcher } from './watcher'
import type { TrackerState } from '@shared/types'

export class Tracker {
  private watcher: SaveWatcher | null = null
  private state: TrackerState = {
    status: 'no-save',
    savePath: null,
    hasKey: false,
    lastError: null,
    snapshot: null
  }

  constructor(private readonly onUpdate: (state: TrackerState) => void) {}

  getState(): TrackerState {
    return this.state
  }

  /** (Re)avalia caminho do save, inicia o watcher e faz uma leitura. */
  start(): void {
    const savePath = store.getSavePathOverride() ?? locateSave()
    this.state.savePath = savePath
    this.state.hasKey = store.hasKey()

    if (this.watcher) {
      this.watcher.stop()
      this.watcher = null
    }

    if (savePath && existsSync(savePath)) {
      this.watcher = new SaveWatcher(savePath, () => this.readSave())
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
  }
}
