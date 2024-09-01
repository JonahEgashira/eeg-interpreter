import { ipcMain } from 'electron'
import { runPythonCode } from './pythonHandler'
import {
  saveConversationFile,
  loadConversationFromFile,
  appendMessageToFile
} from './jsonFileHandler'
import { Conversation, Message } from '@shared/chat'
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

  ipcMain.handle('save-conversation', (_, conversation: Conversation) => {
    try {
      saveConversationFile(conversation)
      return { succss: true }
    } catch (error) {
      console.error('Error saving conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('load-conversation', () => {
    try {
      const conversation = loadConversationFromFile()
      return { success: true, conversation }
    } catch (error) {
      console.error('Error loading conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('append-message', (_, message: Message) => {
    try {
      appendMessageToFile(message)
      return { success: true }
    } catch (error) {
      console.error('Error appending message:', error)
      return { success: false, error }
    }
  })
}
