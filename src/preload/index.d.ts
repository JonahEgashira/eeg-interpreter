import { ElectronAPI } from '@electron-toolkit/preload'
import { Conversation, Message } from '@shared/types/chat'
import { CustomError } from '@shared/types/errors'
import { ExecutionResult } from '@shared/types/chat'

interface CustomAPI {
  runPythonCode: (figuresDirectoryPath: string, code: string) => Promise<ExecutionResult>
  saveConversationWithPythonResult: (
    conversation: Conversation,
    messageId: number,
    executionResult: ExecutionResult
  ) => Promise<{ success: boolean; error?: CustomError }>
  getEnvVar: (key: string) => Promise<string | null>
  saveConversation: (
    conversation: Conversation
  ) => Promise<{ success: boolean; error?: CustomError }>
  loadConversation: (
    id: string
  ) => Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }>
  createNewConversation: (
    title: string
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
  getConversationImagesDir: (conversationId: string) => Promise<string>
  loadBase64Data: (figurePath: string) => Promise<string | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
