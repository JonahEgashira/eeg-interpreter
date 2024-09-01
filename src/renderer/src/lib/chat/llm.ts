import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { Message } from '@shared/types/chat'
import { appendMessage } from '../ipcFunctions'

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
    for (const message of messages) {
      await appendMessage(message)
    }

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are a helpful assistant.',
      messages: messages
    })

    console.log('Generated text:', text)

    const parsedResponse = ResponseSchema.parse({ text })

    const assistantMessage: Message = { role: 'assistant', content: parsedResponse.text }
    await appendMessage(assistantMessage)

    return parsedResponse.text
  } catch (error) {
    console.error('Error in processInput:', error)
    throw error
  }
}
