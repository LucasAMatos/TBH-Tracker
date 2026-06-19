import { contextBridge, ipcRenderer } from 'electron'
import type { DashboardLayout, TrackerState } from '@shared/types'

const api = {
  getState: () => ipcRenderer.invoke('tbh:getState'),
  getVersion: () => ipcRenderer.invoke('tbh:getVersion'),
  setKey: (key: string) => ipcRenderer.invoke('tbh:setKey', key),
  hasKey: () => ipcRenderer.invoke('tbh:hasKey'),
  setSavePathOverride: (path: string | null) =>
    ipcRenderer.invoke('tbh:setSavePathOverride', path),
  pickSaveFile: () => ipcRenderer.invoke('tbh:pickSaveFile'),
  refresh: () => ipcRenderer.invoke('tbh:refresh'),
  getRawSave: () => ipcRenderer.invoke('tbh:getRawSave'),
  onState: (cb: (state: TrackerState) => void) => {
    const listener = (_e: unknown, state: TrackerState): void => cb(state)
    ipcRenderer.on('tbh:state', listener)
    return () => ipcRenderer.removeListener('tbh:state', listener)
  },
  getBoxThresholds: () => ipcRenderer.invoke('tbh:getBoxThresholds'),
  setBoxThresholds: (warn: number, high: number) =>
    ipcRenderer.invoke('tbh:setBoxThresholds', warn, high),
  getRuneTarget: () => ipcRenderer.invoke('tbh:getRuneTarget'),
  setRuneTarget: (key: number | null) => ipcRenderer.invoke('tbh:setRuneTarget', key),
  getDashboardLayout: () => ipcRenderer.invoke('tbh:getDashboardLayout'),
  setDashboardLayout: (layout: DashboardLayout) =>
    ipcRenderer.invoke('tbh:setDashboardLayout', layout),
  saveTextFile: (defaultName: string, content: string) =>
    ipcRenderer.invoke('tbh:saveTextFile', defaultName, content),
  getNews: (force?: boolean) => ipcRenderer.invoke('tbh:getNews', force),
  openExternal: (url: string) => ipcRenderer.invoke('tbh:openExternal', url),
  findKey: () => ipcRenderer.invoke('tbh:findKey')
}

contextBridge.exposeInMainWorld('tbh', api)
