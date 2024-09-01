import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Conversation, Message } from '@shared/types/chat'

// Custom APIs for renderer
const api = {
  runPythonCode: (code: string) => ipcRenderer.invoke('run-python-code', code),
  getEnvVar: (key: string) => ipcRenderer.invoke('get-env-vars', key),
  saveConversation: (conversation: Conversation) =>
    ipcRenderer.invoke('save-conversation', conversation),
  loadConversation: () => ipcRenderer.invoke('load-conversation'),
  appendMessage: (message: Message) => ipcRenderer.invoke('append-message', message)
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
