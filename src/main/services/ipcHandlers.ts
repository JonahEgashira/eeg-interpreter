import { ipcMain } from 'electron'
import { runPythonCode, saveConversationWithPythonResult } from './pythonHandler'
import {
  saveConversation,
  saveSettingsToFile,
  loadConversation,
  appendMessage,
  createNewConversation,
  listConversations,
  deleteConversation,
  getConversationImagesDir,
  getSettingsFromFile
} from './jsonFileHandler'
import { loadBase64Data } from './figureHandler'
import { Conversation, ExecutionResult, Message } from '@shared/types/chat'

export function setupIpcHandlers(): void {
  ipcMain.handle('run-python-code', async (_, figuresDirectoryPath: string, code: string) => {
    try {
      return await runPythonCode(figuresDirectoryPath, code)
    } catch (error) {
      console.error('Error running Python code:', error)
      return error
    }
  })

  ipcMain.handle(
    'save-conversation-with-python-result',
    async (_, conversation: Conversation, messageId: number, executionResult: ExecutionResult) => {
      try {
        await saveConversationWithPythonResult(conversation, messageId, executionResult)
        return { success: true }
      } catch (error) {
        console.error('Error saving conversation with Python result:', error)
        return { success: false, error }
      }
    }
  )

  ipcMain.handle('get-settings-from-file', async () => {
    try {
      return await getSettingsFromFile()
    } catch (error) {
      console.error('Error loading settings from file:', error)
      return null
    }
  })

  ipcMain.handle('save-settings-to-file', async (_, settings: Record<string, string>) => {
    try {
      await saveSettingsToFile(settings)
      return { success: true }
    } catch (error) {
      console.error('Error saving settings to file:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('save-conversation', async (_, conversation: Conversation) => {
    try {
      await saveConversation(conversation)
      return { success: true }
    } catch (error) {
      console.error('Error saving conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('load-conversation', async (_, id: string) => {
    try {
      const conversation = await loadConversation(id)
      return { success: true, conversation }
    } catch (error) {
      console.error('Error loading conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('create-new-conversation', async (_, title: string) => {
    try {
      const newConversation = await createNewConversation(title)
      return { success: true, conversation: newConversation }
    } catch (error) {
      console.error('Error creating new conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('append-message', async (_, conversationId: string, message: Message) => {
    try {
      await appendMessage(conversationId, message)
      return { success: true }
    } catch (error) {
      console.error('Error appending message:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('list-conversations', async () => {
    try {
      const conversations = await listConversations()
      return { success: true, conversations }
    } catch (error) {
      console.error('Error listing conversations:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('delete-conversation', async (_, id: string) => {
    try {
      await deleteConversation(id)
      return { success: true }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('get-conversation-images-dir', (_, conversationId: string) => {
    try {
      return getConversationImagesDir(conversationId)
    } catch (error) {
      console.error('Error getting conversation images dir:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('load-base64-data', async (_, figurePath: string) => {
    try {
      return await loadBase64Data(figurePath)
    } catch (error) {
      console.error('Error loading base64 data:', error)
      return null
    }
  })
}
