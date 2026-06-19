import { join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import * as store from './store'
import { Tracker } from './tracker'
import type { TrackerState } from '@shared/types'

let mainWindow: BrowserWindow | null = null
let tracker: Tracker | null = null

function broadcastState(state: TrackerState): void {
  mainWindow?.webContents.send('tbh:state', state)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    backgroundColor: '#0d1117',
    show: false,
    title: 'TBH-Tracker',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // electron-vite injeta ELECTRON_RENDERER_URL em dev
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('tbh:getState', () => tracker?.getState())
  ipcMain.handle('tbh:getVersion', () => app.getVersion())
  ipcMain.handle('tbh:hasKey', () => store.hasKey())

  ipcMain.handle('tbh:setKey', (_e, key: string) => {
    store.setKey(key)
    return tracker?.refresh()
  })

  ipcMain.handle('tbh:setSavePathOverride', (_e, path: string | null) => {
    store.setSavePathOverride(path)
    return tracker?.refresh()
  })

  ipcMain.handle('tbh:pickSaveFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecione o SaveFile_Live.es3',
      properties: ['openFile'],
      filters: [{ name: 'Easy Save 3', extensions: ['es3'] }]
    })
    if (!result.canceled && result.filePaths[0]) {
      store.setSavePathOverride(result.filePaths[0])
    }
    return tracker?.refresh()
  })

  ipcMain.handle('tbh:refresh', () => tracker?.refresh())

  ipcMain.handle('tbh:getBoxThresholds', () => store.getBoxThresholds())
  ipcMain.handle('tbh:setBoxThresholds', (_e, warn: number, high: number) =>
    store.setBoxThresholds(warn, high)
  )

  ipcMain.handle('tbh:getRuneTarget', () => store.getRuneTarget())
  ipcMain.handle('tbh:setRuneTarget', (_e, key: number | null) => store.setRuneTarget(key))
}

app.whenReady().then(() => {
  registerIpc()
  tracker = new Tracker(broadcastState)
  createWindow()
  tracker.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  tracker?.stop()
  if (process.platform !== 'darwin') app.quit()
})

// Garante o flush do histórico (I6) em qualquer caminho de saída (inclui macOS).
app.on('before-quit', () => {
  tracker?.stop()
})
