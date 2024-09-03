import { ipcMain } from 'electron'
import { runPythonCode } from './pythonHandler'
import {
  saveConversation,
  loadConversation,
  appendMessage,
  createNewConversation,
  listConversations,
  deleteConversation
} from './jsonFileHandler'
import { Conversation, Message } from '@shared/types/chat'
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
      saveConversation(conversation)
      return { success: true }
    } catch (error) {
      console.error('Error saving conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('load-conversation', (_, id: string) => {
    try {
      const conversation = loadConversation(id)
      return { success: true, conversation }
    } catch (error) {
      console.error('Error loading conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('create-new-conversation', (_, title?: string) => {
    try {
      const newConversation = createNewConversation(title)
      return { success: true, conversation: newConversation }
    } catch (error) {
      console.error('Error creating new conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('append-message', (_, conversationId: string, message: Message) => {
    try {
      appendMessage(conversationId, message)
      return { success: true }
    } catch (error) {
      console.error('Error appending message:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('list-conversations', () => {
    try {
      const conversations = listConversations()
      return { success: true, conversations }
    } catch (error) {
      console.error('Error listing conversations:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('delete-conversation', (_, id: string) => {
    try {
      deleteConversation(id)
      return { success: true }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      return { success: false, error }
    }
  })
}
