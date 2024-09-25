import { SystemPrompt } from '@renderer/lib/config/prompts'
import { v4 as uuidv4 } from 'uuid'

export interface ExecutionResult {
  code: string
  output?: string
  figurePaths?: string[]
}

export interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  isExecutionMessage?: boolean
  executionResult?: ExecutionResult
  filePaths?: string[]
  systemPrompt: SystemPrompt
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  filePaths: string[]
  createdAt: Date
  updatedAt: Date
}

export enum LLMModel {
  GPT_4o = 'gpt-4o',
  GPT_4o_mini = 'gpt-4o-mini',
  o1_mini = 'o1-mini',
  gemini_1_5_pro = 'gemini-1.5-pro'
}

export type ConversationJSON = Omit<Conversation, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export function createConversation(
  id: string | null = null,
  title: string,
  messages: Message[] = [],
  filePaths: string[] = []
): Conversation {
  return {
    id: id || uuidv4(),
    title,
    messages,
    filePaths,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export function addExecutionResult(
  conversation: Conversation,
  messageId: number,
  result: ExecutionResult
): Conversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.id === messageId
        ? {
            ...message,
            executionResult: result
          }
        : message
    )
  }
}

export function updateConversation(
  conversation: Conversation,
  message: Message,
  filePaths: string[] = []
): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    filePaths: [...conversation.filePaths, ...filePaths],
    updatedAt: new Date()
  }
}

export function conversationToJSON(conversation: Conversation): ConversationJSON {
  return {
    ...conversation,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString()
  }
}

export function conversationFromJSON(json: ConversationJSON): Conversation {
  return {
    ...json,
    createdAt: new Date(json.createdAt),
    updatedAt: new Date(json.updatedAt)
  }
}
