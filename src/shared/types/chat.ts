import { v4 as uuidv4 } from 'uuid'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ConversationJSON {
  id: string
  title: string | null
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export class Conversation {
  id: string
  title: string | null
  messages: Message[]
  createdAt: Date
  updatedAt: Date

  constructor(id: string | null, title: string | null, messages: Message[] = []) {
    this.id = id || uuidv4()
    this.title = title
    this.messages = messages
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  addMessage(message: Message): void {
    this.messages.push(message)
    this.updatedAt = new Date()
  }

  toJSON(): ConversationJSON {
    return {
      id: this.id,
      title: this.title,
      messages: this.messages,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  static fromJSON(json: ConversationJSON): Conversation {
    const conv = new Conversation(json.id, json.title, json.messages)
    conv.createdAt = new Date(json.createdAt)
    conv.updatedAt = new Date(json.updatedAt)
    return conv
  }
}
