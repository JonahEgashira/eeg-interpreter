import { v4 as uuidv4 } from 'uuid'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Conversation {
  id: string
  title: string | null
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
  title: string | null = null,
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
