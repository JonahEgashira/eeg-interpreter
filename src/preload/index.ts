import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Conversation, Message } from '@shared/types/chat'
import { CustomError } from '@shared/types/errors'
import { ExecutionResult } from '@shared/types/chat'

const api = {
  runPythonCode: (
    figuresDirectoryPath: string,
    code: string,
    conversationId: string
  ): Promise<ExecutionResult> =>
    ipcRenderer.invoke('run-python-code', figuresDirectoryPath, code, conversationId),

  saveConversationWithPythonResult: (
    conversation: Conversation,
    messageId: number,
    executionResult: ExecutionResult
  ): Promise<{ success: boolean; error?: CustomError }> =>
    ipcRenderer.invoke(
      'save-conversation-with-python-result',
      conversation,
      messageId,
      executionResult
    ),

  getSettingsFromFile: (): Promise<Record<string, string> | null> =>
    ipcRenderer.invoke('get-settings-from-file'),

  saveSettingsToFile: (
    settings: Record<string, string>
  ): Promise<{ success: boolean; error?: CustomError }> =>
    ipcRenderer.invoke('save-settings-to-file', settings),

  saveConversation: (
    conversation: Conversation
  ): Promise<{ success: boolean; error?: CustomError }> =>
    ipcRenderer.invoke('save-conversation', conversation),

  loadConversation: (
    id: string
  ): Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }> =>
    ipcRenderer.invoke('load-conversation', id),

  createNewConversation: (
    title: string
  ): Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }> =>
    ipcRenderer.invoke('create-new-conversation', title),

  appendMessage: (
    conversationId: string,
    message: Message
  ): Promise<{ success: boolean; error?: CustomError }> =>
    ipcRenderer.invoke('append-message', conversationId, message),

  listConversations: (): Promise<{
    success: boolean
    conversations?: Conversation[]
    error?: CustomError
  }> => ipcRenderer.invoke('list-conversations'),

  deleteConversation: (id: string): Promise<{ success: boolean; error?: CustomError }> =>
    ipcRenderer.invoke('delete-conversation', id),

  getConversationImagesDir: (conversationId: string): Promise<string> =>
    ipcRenderer.invoke('get-conversation-images-dir', conversationId),

  loadBase64Data: (figurePath: string): Promise<string | null> =>
    ipcRenderer.invoke('load-base64-data', figurePath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
