import { Message, Conversation } from '@shared/types/chat'

export async function runPythonCode(code: string): Promise<string> {
  try {
    const result = await window.api.runPythonCode(code)
    return result
  } catch (error) {
    console.error('Error running Python code:', error)
    throw error
  }
}

export async function getEnvVar(key: string): Promise<string | null> {
  try {
    const value = await window.api.getEnvVar(key)
    return value
  } catch (error) {
    console.error('Error getting environment variable:', error)
    throw error
  }
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  try {
    await window.api.saveConversation(conversation)
  } catch (error) {
    console.error('Error saving conversation:', error)
    throw error
  }
}

export async function loadConversation(): Promise<Conversation | null> {
  try {
    const conversation = await window.api.loadConversation()
    return conversation
  } catch (error) {
    console.error('Error loading conversation:', error)
    throw error
  }
}

export async function appendMessage(message: Message): Promise<void> {
  try {
    await window.api.appendMessage(message)
  } catch (error) {
    console.error('Error appending message:', error)
    throw error
  }
}
