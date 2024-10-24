import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { PythonManager, startJupyterServer, stopJupyterServer } from './services/pythonHandler'
import { setupIpcHandlers } from './services/ipcHandlers'
import log from 'electron-log'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null

function createLoadingWindow(): void {
  loadingWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    show: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      sandbox: false
    }
  })

  loadingWindow.center()

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    loadingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/loading.html`)
  } else {
    loadingWindow.loadFile(join(__dirname, '../renderer/loading.html'))
  }
}
function createWindow(): void {
  console.log('Creating main window...')
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    setTimeout(() => {
      if (loadingWindow) {
        loadingWindow.destroy()
        loadingWindow = null
      }
      mainWindow?.show()
    }, 500)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function initializeApp(): Promise<void> {
  try {
    electronApp.setAppUserModelId('com.electron')
    setupIpcHandlers()
    createLoadingWindow()

    const pythonManager = PythonManager.getInstance()
    await pythonManager.setup()
    log.info('Python setup completed')

    log.info('Installing required packages...')
    await pythonManager.installRequirements()
    log.info('Required packages installed')

    log.info('Starting Jupyter server...')
    await startJupyterServer()
    log.info('Jupyter server started')

    createWindow()
  } catch (error) {
    log.error('Failed to initialize app:', error)
    loadingWindow?.webContents.send('setup-error', { error: error })
    setTimeout(() => {
      loadingWindow?.destroy()
      app.quit()
    }, 3000)
  }
}

app.whenReady().then(initializeApp)

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await stopJupyterServer()
    app.quit()
  }
})

app.on('activate', () => {
  if (!mainWindow) {
    createWindow()
  }
})

app.on('before-quit', async () => {
  try {
    await stopJupyterServer()
    console.log('Jupyter server stopped')
  } catch (err) {
    console.error('Error stopping Jupyter server:', err)
  }
})
