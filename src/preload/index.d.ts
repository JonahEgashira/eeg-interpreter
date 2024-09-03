import { ElectronAPI } from '@electron-toolkit/preload'
import { Conversation, Message } from '@shared/types/chat'
import { CustomError } from '@shared/types/errors'

interface CustomAPI {
  runPythonCode: (code: string) => Promise<string>
  getEnvVar: (key: string) => Promise<string | null>
  loadConversation: (
    id: string
  ) => Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }>
  createNewConversation: (
    title?: string
  ) => Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }>
  appendMessage: (
    conversationId: string,
    message: Message
  ) => Promise<{ success: boolean; error?: CustomError }>
  listConversations: () => Promise<{
    success: boolean
    conversations?: Conversation[]
    error?: CustomError
  }>
  deleteConversation: (id: string) => Promise<{ success: boolean; error?: CustomError }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
