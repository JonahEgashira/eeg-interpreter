import { ipcMain } from 'electron'
import { runPythonCode } from '../services/PythonRunner'
import * as dotenv from 'dotenv'

dotenv.config()

export function setupIpcHandlers(): void {
  ipcMain.handle('run-python-code', async (_, code: string) => {
    try {
      return await runPythonCode(code)
    } catch (error) {
      console.error('Error running Python code:', error)
      return error
    }
  })

  const allowedEnvVars = ['OPENAI_API_KEY']

  ipcMain.handle('get-env-vars', (_, key: string) => {
    if (allowedEnvVars.includes(key)) {
      return process.env[key]
    }
    return null
  })
}
