import { spawn, ChildProcess, exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { KernelManager, ServerConnection } from '@jupyterlab/services'
import { app } from 'electron'
import { handleFigureData } from './figureHandler'
import { Conversation, ExecutionResult, addExecutionResult } from '@shared/types/chat'
import * as crypto from 'crypto'
import { getConversationDir, saveConversation } from './jsonFileHandler'
import fixPath from 'fix-path'
import log from 'electron-log'

const JUPYTER_TOKEN = crypto.randomBytes(16).toString('hex')
const JUPYTER_PORT = 8888
let jupyterProcess: ChildProcess | null = null

fixPath()

const userDataPath = app.getPath('userData')
process.chdir(userDataPath)

function getJupyterPath(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('which jupyter', (error, stdout, stderr) => {
      if (error) {
        log.error(`Error finding jupyter: ${stderr}`)
        return reject(new Error(`Error finding jupyter: ${stderr}`))
      }
      const jupyterPath = stdout.trim()
      log.info(`Jupyter executable path: ${jupyterPath}`)
      if (!jupyterPath) {
        log.error('Jupyter path not found')
        return reject(new Error('Jupyter path not found'))
      }
      resolve(jupyterPath)
    })
  })
}

export function startJupyterServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    getJupyterPath().then((jupyterPath) => {
      jupyterProcess = spawn(
        jupyterPath,
        [
          'notebook',
          '--no-browser',
          `--port=${JUPYTER_PORT}`,
          `--IdentityProvider.token=${JUPYTER_TOKEN}`,
          '--ServerApp.disable_check_xsrf=True'
        ],
        {
          env: { ...process.env, PATH: `${path.dirname(jupyterPath)}:${process.env.PATH}` }
        }
      )

      if (!jupyterProcess) {
        return reject(new Error('Failed to start Jupyter server'))
      }

      jupyterProcess.stdout?.on('data', (data) => {
        console.log(`Jupyter stdout: ${data}`)
        if (data.toString().includes(`http://localhost:${JUPYTER_PORT}/`)) {
          resolve()
        }
      })

      jupyterProcess.stderr?.on('data', (data) => {
        console.error(`Jupyter stderr: ${data}`)
      })

      jupyterProcess.on('close', (code) => {
        console.log(`Jupyter server exited with code ${code}`)
        jupyterProcess = null
      })

      jupyterProcess.on('error', (err) => {
        console.error('Failed to start Jupyter server:', err)
        reject(err)
      })
    })
  })
}

export function stopJupyterServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!jupyterProcess) {
      return resolve()
    }

    jupyterProcess.on('close', () => {
      console.log('Jupyter server stopped')
      jupyterProcess = null
      resolve()
    })

    jupyterProcess.on('error', (err) => {
      console.error('Error stopping Jupyter server:', err)
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

    future.done.then(() => {
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
  })
}

async function runSystemPython(
  code: string,
  conversationId: string
): Promise<{ stdout: string; stderr: string }> {
  const baseDir = getConversationDir(conversationId)
  const tempFilePath = path.join(baseDir, `${conversationId}.py`)

  await fs.promises.writeFile(tempFilePath, code)

  console.log('Running system Python')
  return new Promise((resolve, reject) => {
    exec(`python3 "${tempFilePath}"`, async (error, stdout, stderr) => {
      await fs.promises.unlink(tempFilePath)

      if (error) {
        console.error('Python script execution error:', error)
        return reject({ stdout, stderr })
      }

      resolve({ stdout, stderr })
    })
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
    console.error('Error updating and saving conversation:', error)
    throw error
  }
}
