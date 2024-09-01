import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { Message } from '@shared/chat'

export const InputSchema = z.object({
  input: z.string().min(1, 'Input must not be empty')
})

const ResponseSchema = z.object({
  text: z.string()
})

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
