import { spawn, ChildProcess, exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { KernelManager, ServerConnection } from '@jupyterlab/services'
import { app } from 'electron'
import { handleFigureData } from './figureHandler'
import { Conversation, ExecutionResult, addExecutionResult } from '@shared/types/chat'
import * as crypto from 'crypto'
import { getConversationDir, saveConversation } from './jsonFileHandler'
import log from 'electron-log'
import * as https from 'https'
import * as tar from 'tar'
import { IncomingMessage } from 'http'

const JUPYTER_TOKEN = crypto.randomBytes(16).toString('hex')
const JUPYTER_PORT = 8888
let jupyterProcess: ChildProcess | null = null

interface PythonBuildInfo {
  url: string
  platformDir: string
  executablePath: string
}

const PYTHON_VERSION = '3.11.10'
const RELEASE_VERSION = '20241016'
const BASE_URL = 'https://github.com/indygreg/python-build-standalone/releases/download'

interface PlatformBuildInfo {
  [arch: string]: PythonBuildInfo
}

const PYTHON_BUILD_INFO: Record<string, PlatformBuildInfo> = {
  darwin: {
    arm64: {
      url: `${BASE_URL}/${RELEASE_VERSION}/cpython-${PYTHON_VERSION}+${RELEASE_VERSION}-aarch64-apple-darwin-install_only.tar.gz`,
      platformDir: 'python',
      executablePath: 'bin/python3'
    },
    x64: {
      url: `${BASE_URL}/${RELEASE_VERSION}/cpython-${PYTHON_VERSION}+${RELEASE_VERSION}-x86_64-apple-darwin-install_only.tar.gz`,
      platformDir: 'python',
      executablePath: 'bin/python3'
    }
  },
  win32: {
    x64: {
      url: `${BASE_URL}/${RELEASE_VERSION}/cpython-${PYTHON_VERSION}+${RELEASE_VERSION}-x86_64-pc-windows-msvc-shared-install_only.tar.gz`,
      platformDir: 'python',
      executablePath: 'python.exe'
    }
  }
}

export class PythonManager {
  private static instance: PythonManager
  private pythonPath: string | null = null
  private pythonDir: string | null = null

  static getInstance(): PythonManager {
    if (!PythonManager.instance) {
      PythonManager.instance = new PythonManager()
    }
    return PythonManager.instance
  }

  // Pythonのセットアップを行う
  async setup(): Promise<void> {
    const appDir = app.getPath('userData')
    const platformBuildInfo = PYTHON_BUILD_INFO[process.platform]

    if (!platformBuildInfo) {
      throw new Error(`Unsupported platform: ${process.platform}`)
    }

    const archBuildInfo = platformBuildInfo[process.arch]

    if (!archBuildInfo) {
      throw new Error(`Unsupported architecture: ${process.arch} for platform: ${process.platform}`)
    }

    this.pythonDir = path.join(appDir, archBuildInfo.platformDir)
    this.pythonPath = path.join(this.pythonDir, archBuildInfo.executablePath)

    // Pythonが既にインストールされているか確認
    if (fs.existsSync(this.pythonPath)) {
      log.info(`Python is already installed at ${this.pythonPath}`)
      return
    }

    log.info('Installing Python...', archBuildInfo)
    await this.downloadAndExtractPython(archBuildInfo)
  }

  // Python実行ファイルのパスを取得
  getPythonPath(): string {
    if (!this.pythonPath) {
      throw new Error('Python is not set up. Call setup() first.')
    }
    return this.pythonPath
  }

  // 環境変数を取得
  getEnv(): NodeJS.ProcessEnv {
    if (!this.pythonDir) {
      throw new Error('Python is not set up. Call setup() first.')
    }

    const env = { ...process.env }
    const pathSeparator = process.platform === 'win32' ? ';' : ':'

    // Windowsの場合はScriptsディレクトリ、それ以外はbinディレクトリを使用
    const binDir =
      process.platform === 'win32'
        ? path.join(this.pythonDir, 'Scripts')
        : path.join(this.pythonDir, 'bin')

    // PATHの設定（Windowsの場合はpythonDirも追加）
    env.PATH =
      process.platform === 'win32'
        ? [binDir, this.pythonDir, env.PATH].join(pathSeparator)
        : [binDir, env.PATH].join(pathSeparator)

    // PYTHONHOME, PYTHONPATHの設定
    env.PYTHONHOME = this.pythonDir

    // Windowsの場合のパス設定を修正
    if (process.platform === 'win32') {
      env.PYTHONPATH = path.join(this.pythonDir, 'Lib', 'site-packages')
    } else {
      env.PYTHONPATH = path.join(this.pythonDir, 'lib', 'python3.11', 'site-packages')
    }

    return env
  }

  private async downloadAndExtractPython(buildInfo: PythonBuildInfo): Promise<void> {
    if (!this.pythonDir) throw new Error('Python directory is not set')

    // 一時ファイルのパスを設定
    const tempFile = path.join(this.pythonDir, 'python-temp.tar.gz')
    const tempExtractDir = path.join(this.pythonDir, 'temp-extract')

    try {
      // ディレクトリの作成
      await fs.promises.mkdir(this.pythonDir, { recursive: true })
      await fs.promises.mkdir(tempExtractDir, { recursive: true })

      // ダウンロード処理
      await new Promise<void>((resolve, reject) => {
        const fileStream = fs.createWriteStream(tempFile)

        const handleResponse = (response: IncomingMessage) => {
          if (response.statusCode !== 200) {
            fileStream.close()
            reject(new Error(`Failed to download: ${response.statusCode}`))
            return
          }

          response.pipe(fileStream)

          fileStream.on('error', (err) => {
            fileStream.close()
            reject(err)
          })

          fileStream.on('finish', () => {
            fileStream.close()
            log.info('Download completed successfully')
            resolve()
          })
        }

        const request = https.get(buildInfo.url, (response) => {
          if (response.statusCode === 302 && response.headers.location) {
            https.get(response.headers.location, handleResponse).on('error', (err) => {
              fileStream.close()
              reject(err)
            })
          } else {
            handleResponse(response)
          }
        })

        request.on('error', (err) => {
          fileStream.close()
          reject(err)
        })
      })

      // まず一時ディレクトリに解凍
      log.info('Starting extraction to temp directory...')
      await tar.x({
        file: tempFile,
        cwd: tempExtractDir
      })

      // 一時ディレクトリの内容を確認
      const extractedContents = await fs.promises.readdir(tempExtractDir)
      log.info('Extracted contents:', extractedContents)

      // pythonディレクトリの中身を本来のディレクトリに移動
      const pythonSourceDir = path.join(tempExtractDir, 'python')
      if (fs.existsSync(pythonSourceDir)) {
        log.info('Moving contents from temp directory to final location...')
        const contents = await fs.promises.readdir(pythonSourceDir)
        for (const item of contents) {
          const sourcePath = path.join(pythonSourceDir, item)
          const targetPath = path.join(this.pythonDir, item)
          await fs.promises.rename(sourcePath, targetPath)
        }
      } else {
        throw new Error('Expected python directory not found in extracted contents')
      }

      log.info('Cleaning up...')
      // 一時ファイルとディレクトリの削除
      await fs.promises.rm(tempFile)
      await fs.promises.rm(tempExtractDir, { recursive: true })

      log.info('Installation completed successfully')
    } catch (error) {
      log.error('Error during download or extraction:', error)
      // エラー時のクリーンアップ
      try {
        if (fs.existsSync(tempFile)) {
          await fs.promises.unlink(tempFile)
        }
        if (fs.existsSync(tempExtractDir)) {
          await fs.promises.rm(tempExtractDir, { recursive: true })
        }
      } catch (cleanupError) {
        log.error('Error during cleanup:', cleanupError)
      }
      throw error
    }
  }

  async installRequirements(): Promise<void> {
    const requirements = [
      'jupyter',
      'numpy',
      'pandas',
      'matplotlib',
      'mne',
      'autoreject',
      'statsmodels'
    ]
    const pythonPath = this.getPythonPath()

    log.info('Installing required packages...')

    // ensurepipを使用してpipをインストール
    await new Promise<void>((resolve, reject) => {
      exec(`"${pythonPath}" -m ensurepip --upgrade`, { env: this.getEnv() }, (error) => {
        if (error) {
          log.error('Error installing pip:', error)
          reject(error)
        } else {
          log.info('pip installed/upgraded successfully')
          resolve()
        }
      })
    })

    // 必要なパッケージのインストール
    for (const pkg of requirements) {
      log.info(`Installing ${pkg}...`)
      await new Promise<void>((resolve, reject) => {
        exec(
          `"${pythonPath}" -m pip install ${pkg}`,
          { env: this.getEnv() },
          (error, stdout, stderr) => {
            if (error) {
              log.error(`Error installing ${pkg}:`, stderr)
              reject(error)
            } else {
              log.info(`${pkg} installed successfully`, stdout)
              resolve()
            }
          }
        )
      })
    }

    log.info('All required packages installed successfully')
  }
}

export async function startJupyterServer(): Promise<void> {
  const pythonManager = PythonManager.getInstance()
  await pythonManager.setup()

  const pythonDir = path.dirname(pythonManager.getPythonPath())

  // プラットフォームごとにjupyterの実行ファイルパスを設定
  const jupyterPath =
    process.platform === 'win32'
      ? path.join(pythonDir, 'Scripts', 'jupyter.exe') // Windows用
      : path.join(pythonDir, 'jupyter') // macOS/Linux用

  // Jupyter実行ファイルの存在確認
  if (!fs.existsSync(jupyterPath)) {
    log.error(`Jupyter executable not found at ${jupyterPath}`)
    throw new Error(`Jupyter executable not found at ${jupyterPath}`)
  } else {
    log.info(`Jupyter executable found at ${jupyterPath}`)
  }

  return new Promise((resolve, reject) => {
    jupyterProcess = spawn(
      jupyterPath,
      [
        'notebook',
        '--no-browser',
        `--port=${JUPYTER_PORT}`,
        `--IdentityProvider.token=${JUPYTER_TOKEN}`,
        '--ServerApp.disable_check_xsrf=True'
      ],
      { env: pythonManager.getEnv() }
    )

    if (!jupyterProcess) {
      return reject(new Error('Failed to start Jupyter server'))
    }

    log.info(`Jupyter server started on port ${JUPYTER_PORT}`)

    jupyterProcess.stdout?.on('data', (data) => {
      log.info(`Jupyter stdout: ${data}`)
    })

    jupyterProcess.stderr?.on('data', (data) => {
      log.error(`Jupyter stderr: ${data}`)
      if (data.toString().includes(`http://localhost:${JUPYTER_PORT}/`)) {
        resolve()
      }
    })

    jupyterProcess.on('close', (code) => {
      log.info(`Jupyter server exited with code ${code}`)
      jupyterProcess = null
    })

    jupyterProcess.on('error', (err) => {
      log.error('Failed to start Jupyter server:', err)
      reject(err)
    })
  })
}

export function stopJupyterServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!jupyterProcess) {
      return resolve()
    }

    jupyterProcess.on('close', () => {
      log.info('Jupyter server stopped')
      jupyterProcess = null
      resolve()
    })

    jupyterProcess.on('error', (err) => {
      log.error('Error stopping Jupyter server:', err)
      reject(err)
    })

    jupyterProcess.kill()
  })
}

export async function runPythonCode(
  figuresDirectoryPath: string,
  code: string,
  conversationId: string
): Promise<ExecutionResult> {
  const settings = ServerConnection.makeSettings({
    baseUrl: `http://localhost:${JUPYTER_PORT}`,
    token: JUPYTER_TOKEN
  })

  const kernelManager = new KernelManager({ serverSettings: settings })
  const kernel = await kernelManager.startNew({ name: 'python3' })
  const future = kernel.requestExecute({ code })

  return new Promise((resolve, reject) => {
    let output = ''
    const figurePaths: string[] = []

    future.onIOPub = async (msg): Promise<void> => {
      if (msg.header.msg_type === 'execute_result' || msg.header.msg_type === 'stream') {
        output += (msg.content as { text: string }).text
      } else if (msg.header.msg_type === 'display_data') {
        const imageData = (msg.content as { data: { 'image/png': string } }).data['image/png']
        try {
          const { figurePath } = await handleFigureData(imageData, figuresDirectoryPath)
          figurePaths.push(figurePath)
        } catch (error) {
          console.error('Error handling figure data:', error)
        }
      } else if (msg.header.msg_type === 'error') {
        console.error('Error during code execution:', msg.content)
        const errorContent = msg.content as {
          ename: string
          evalue: string
        }

        const errorMessage = `${errorContent.ename}: ${errorContent.evalue}`

        output += errorMessage
        console.log(output)
      }
    }

    future.done
      .then(() => {
        const result: ExecutionResult = { code }
        if (output) result.output = output
        if (figurePaths.length) result.figurePaths = figurePaths

        kernel
          .shutdown()
          .then(() => {
            resolve(result)

            if (figurePaths.length > 0) {
              runSystemPython(code, conversationId)
            }
          })
          .catch((err) => reject(new Error(`Error during code execution: ${err.message}`)))
      })
      .catch((err) => {
        reject(err)
      })
  })
}

// Python実行関数を修正
async function runSystemPython(
  code: string,
  conversationId: string
): Promise<{ stdout: string; stderr: string }> {
  const pythonManager = PythonManager.getInstance()
  const baseDir = getConversationDir(conversationId)
  const tempFilePath = path.join(baseDir, `${conversationId}.py`)

  log.info(`Writing Python code to ${tempFilePath}`)
  await fs.promises.writeFile(tempFilePath, code)

  return new Promise((resolve, reject) => {
    exec(
      `"${pythonManager.getPythonPath()}" "${tempFilePath}"`,
      { env: pythonManager.getEnv() },
      async (error, stdout, stderr) => {
        log.info(`Python script execution stdout: ${stdout}`)
        try {
          await fs.promises.unlink(tempFilePath)
        } catch (unlinkError) {
          log.error(`Error deleting temp file ${tempFilePath}:`, unlinkError)
        }

        if (error) {
          log.error(`Python script execution error: ${stderr || error.message}`)
          return reject({ stdout, stderr: stderr || error.message })
        }

        resolve({ stdout, stderr })
      }
    )
  })
}

export async function saveConversationWithPythonResult(
  conversation: Conversation,
  messageId: number,
  executionResult: ExecutionResult
): Promise<void> {
  try {
    const updatedConversation = addExecutionResult(conversation, messageId, executionResult)
    await saveConversation(updatedConversation)
  } catch (error) {
    log.error('Error updating and saving conversation:', error)
    throw error
  }
}
