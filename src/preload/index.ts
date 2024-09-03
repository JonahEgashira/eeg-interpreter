import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Conversation, Message } from '@shared/types/chat'
import { CustomError } from '@shared/types/errors'

const api = {
  runPythonCode: (code: string): Promise<string> => ipcRenderer.invoke('run-python-code', code),

  getEnvVar: (key: string): Promise<string | null> => ipcRenderer.invoke('get-env-vars', key),

  loadConversation: (
    id: string
  ): Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }> =>
    ipcRenderer.invoke('load-conversation', id),

  createNewConversation: (
    title?: string
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
    ipcRenderer.invoke('delete-conversation', id)
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
