import { z } from 'zod'
import { generateText } from 'ai'
import { Message } from '@shared/types/chat'
import { appendMessage } from '../ipcFunctions'
import { createOpenAI } from '@ai-sdk/openai'

export const InputSchema = z.object({
  input: z.string().min(1, 'Input must not be empty')
})

const ResponseSchema = z.object({
  text: z.string()
})

export async function generateResponse(messages: Message[], openaiApiKey: string): Promise<string> {
  try {
    for (const message of messages) {
      await appendMessage(message)
    }

    const openai = createOpenAI({ apiKey: openaiApiKey })

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
