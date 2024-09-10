import { v4 as uuidv4 } from 'uuid'

export interface ExecutionResult {
  code: string
  output?: string
  figurePaths?: string[]
  error?: string
}

export interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  executionResults?: ExecutionResult[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export type ConversationJSON = Omit<Conversation, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export function createConversation(
  id: string | null = null,
  title: string,
  messages: Message[] = []
): Conversation {
  return {
    id: id || uuidv4(),
    title,
    messages,
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
            executionResults: [...(message.executionResults || []), result]
          }
        : message
    )
  }
}

export function addMessage(conversation: Conversation, message: Message): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
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
