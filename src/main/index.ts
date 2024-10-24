import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { startJupyterServer, stopJupyterServer } from './services/pythonHandler'
import { setupIpcHandlers } from './services/ipcHandlers'
import log from 'electron-log'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null

function createLoadingWindow(): void {
  loadingWindow = new BrowserWindow({
    width: 200,
    height: 100,
    frame: false,
    show: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      sandbox: false
    }
  })

  loadingWindow.center()

  // ローディング画面の内容を直接設定
  loadingWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
      <head>
        <style>
          body {
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: white;
            color: #333;
          }
          .text {
            margin-bottom: 10px;
            font-size: 14px;
          }
          .loader {
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="text">Initializing...</div>
        <div class="loader"></div>
      </body>
    </html>
  `)
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
      webSecurity: false // TODO: fix this
    }
  })

  mainWindow.on('ready-to-show', () => {
    loadingWindow?.destroy()
    loadingWindow = null
    mainWindow?.show()
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

    // ローディング画面を表示
    createLoadingWindow()

    log.info('Starting Jupyter server...')
    await startJupyterServer()
    log.info('Jupyter server started successfully')

    createWindow()

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  } catch (error) {
    log.error('Failed to initialize app:', error)
    loadingWindow?.destroy()
    app.quit()
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
