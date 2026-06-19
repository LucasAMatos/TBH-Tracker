import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { findEs3Key } from './keyFinder'
import { locateSave } from './locator'
import { fetchNews } from './news'
import * as store from './store'
import { Tracker } from './tracker'
import type { DashboardLayout, KeyFindResult, TrackerState } from '@shared/types'

let mainWindow: BrowserWindow | null = null
let tracker: Tracker | null = null

function broadcastState(state: TrackerState): void {
  mainWindow?.webContents.send('tbh:state', state)
}

// Salva o tamanho/posição "normais" (não os de maximizado) + flag de maximizado (I10).
function persistWindowState(): void {
  if (!mainWindow) return
  const bounds = mainWindow.getNormalBounds()
  store.setWindowState({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    maximized: mainWindow.isMaximized()
  })
}

function createWindow(): void {
  const saved = store.getWindowState()
  mainWindow = new BrowserWindow({
    width: saved?.width ?? 1100,
    height: saved?.height ?? 760,
    x: saved?.x,
    y: saved?.y,
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

  if (saved?.maximized) mainWindow.maximize()

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  // Persiste o estado ao fechar a janela (I10).
  mainWindow.on('close', persistWindowState)

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

  // JSON bruto do save sob demanda (I7): só lido quando o visualizador de calibração abre.
  ipcMain.handle('tbh:getRawSave', () => tracker?.readRawSave() ?? null)

  ipcMain.handle('tbh:getBoxThresholds', () => store.getBoxThresholds())
  ipcMain.handle('tbh:setBoxThresholds', (_e, warn: number, high: number) =>
    store.setBoxThresholds(warn, high)
  )

  ipcMain.handle('tbh:getRuneTarget', () => store.getRuneTarget())
  ipcMain.handle('tbh:setRuneTarget', (_e, key: number | null) => store.setRuneTarget(key))

  ipcMain.handle('tbh:getDashboardLayout', () => store.getDashboardLayout())
  ipcMain.handle('tbh:setDashboardLayout', (_e, layout: DashboardLayout) =>
    store.setDashboardLayout(layout)
  )

  // Descoberta automatica da chave ES3 nos arquivos do jogo (leitura passiva em disco).
  // Mostra um aviso/consentimento ANTES de ler qualquer arquivo do jogo.
  ipcMain.handle('tbh:findKey', async (): Promise<KeyFindResult> => {
    const savePath = store.getSavePathOverride() ?? locateSave()
    if (!savePath || !existsSync(savePath)) return { status: 'no-save' }

    const choice = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      buttons: ['Cancelar', 'Continuar'],
      defaultId: 1,
      cancelId: 0,
      title: 'Localizar a chave automaticamente',
      message: 'Procurar a chave de descriptografia nos arquivos do jogo?',
      detail:
        'O TBH-Tracker vai LER (somente leitura) os arquivos de instalação do jogo no ' +
        'disco — em especial o "resources.assets", onde o Easy Save 3 guarda a senha do ' +
        'save — e testá-la contra o seu save.\n\n' +
        'Isto NÃO toca no processo nem na memória do jogo, NÃO injeta nada, NÃO modifica ' +
        'nenhum arquivo e NÃO acessa a internet. É a mesma postura passiva da leitura do ' +
        'save. A chave fica guardada localmente e cifrada pelo sistema.',
      noLink: true
    })
    if (choice.response !== 1) return { status: 'cancelled' }

    const result = findEs3Key(savePath)
    if (result.status === 'found' && result.key) {
      store.setKey(result.key)
      tracker?.refresh()
    }
    // Nao devolve a chave ao renderer; ela vive so no processo main + store cifrada.
    return { status: result.status, gamePath: result.gamePath, message: result.message }
  })

  // Exportação de dados (E1): abre o diálogo de salvar e grava o conteúdo gerado no renderer.
  ipcMain.handle('tbh:saveTextFile', async (_e, defaultName: string, content: string) => {
    if (typeof content !== 'string') return null
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Exportar dados',
      defaultPath: typeof defaultName === 'string' ? defaultName : 'export.txt'
    })
    if (result.canceled || !result.filePath) return null
    try {
      writeFileSync(result.filePath, content, 'utf8')
      return result.filePath
    } catch {
      return null
    }
  })

  ipcMain.handle('tbh:getNews', (_e, force?: boolean) => fetchNews(force === true))
  ipcMain.handle('tbh:openExternal', (_e, url: string) => {
    // Só abre URLs http(s) no navegador padrão — nada de esquemas arbitrários.
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) return shell.openExternal(url)
    return undefined
  })
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
