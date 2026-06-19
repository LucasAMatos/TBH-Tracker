import { contextBridge, ipcRenderer } from 'electron'
import type { TrackerState } from '@shared/types'

const api = {
  getState: () => ipcRenderer.invoke('tbh:getState'),
  getVersion: () => ipcRenderer.invoke('tbh:getVersion'),
  setKey: (key: string) => ipcRenderer.invoke('tbh:setKey', key),
  hasKey: () => ipcRenderer.invoke('tbh:hasKey'),
  setSavePathOverride: (path: string | null) =>
    ipcRenderer.invoke('tbh:setSavePathOverride', path),
  pickSaveFile: () => ipcRenderer.invoke('tbh:pickSaveFile'),
  refresh: () => ipcRenderer.invoke('tbh:refresh'),
  onState: (cb: (state: TrackerState) => void) => {
    const listener = (_e: unknown, state: TrackerState): void => cb(state)
    ipcRenderer.on('tbh:state', listener)
    return () => ipcRenderer.removeListener('tbh:state', listener)
  },
  getBoxThresholds: () => ipcRenderer.invoke('tbh:getBoxThresholds'),
  setBoxThresholds: (warn: number, high: number) =>
    ipcRenderer.invoke('tbh:setBoxThresholds', warn, high),
  getRuneTarget: () => ipcRenderer.invoke('tbh:getRuneTarget'),
  setRuneTarget: (key: number | null) => ipcRenderer.invoke('tbh:setRuneTarget', key)
}

contextBridge.exposeInMainWorld('tbh', api)
