import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const InputSchema = z.object({
  input: z.string().min(1, 'Input must not be empty')
})

const ResponseSchema = z.object({
  text: z.string()
})

async function getOpenAIApiKey(): Promise<string> {
  const apiKey = await window.api.getEnvVar('OPENAI_API_KEY')

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment variables')
  }

  return apiKey
}

export async function processInput(input: string): Promise<string> {
  const parsedInput = InputSchema.parse({ input })

  try {
    const apiKey = await getOpenAIApiKey()

    const openai = createOpenAI({ apiKey: apiKey })

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
