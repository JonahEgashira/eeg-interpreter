import { ElectronAPI } from '@electron-toolkit/preload'
import { Conversation, Message } from '@shared/types/chat'

interface CustomAPI {
  runPythonCode: (code: string) => Promise<string>
  getEnvVar: (key: string) => Promise<string | null>
  saveConversation: (conversation: Conversation) => Promsise<void>
  loadConversation: () => Promise<Conversation | null>
  appendMessage: (message: Message) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
