import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const InputSchema = z.object({
  input: z.string().min(1, 'Input must not be empty')
})

const ResponseSchema = z.object({
  text: z.string()
})

export class Conversation {
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date

  constructor(title: string, messages: Message[] = []) {
    this.title = title
    this.messages = messages
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  addMessage(message: Message): void {
    this.messages.push(message)
    this.updatedAt = new Date()
  }

  toJSON() {
    return {
      title: this.title,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(json: any): Conversation {
    const conv = new Conversation(json.title)
    conv.messages = json.messages
    conv.createdAt = new Date(json.createdAt)
    conv.updatedAt = new Date(json.updatedAt)
    return conv
  }
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function generateResponse(
  messages: Message[],
  openai: ReturnType<typeof createOpenAI>
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are a helpful assistant.',
      messages: messages
    })

    const parsedResponse = ResponseSchema.parse({ text })

    return parsedResponse.text
  } catch (error) {
    console.error('Error in processInput:', error)
    throw error
  }
}
