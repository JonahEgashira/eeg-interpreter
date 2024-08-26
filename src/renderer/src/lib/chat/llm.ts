import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const InputSchema = z.object({
  input: z.string().min(1, 'Input must not be empty')
})

const ResponseSchema = z.object({
  text: z.string()
})

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function processInput(
  input: string,
  openai: ReturnType<typeof createOpenAI>
): Promise<string> {
  const parsedInput = InputSchema.parse({ input })

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: parsedInput.input
    })

    const parsedResponse = ResponseSchema.parse({ text })

    return parsedResponse.text
  } catch (error) {
    console.error('Error in processInput:', error)
    throw error
  }
}
