import { Message, Conversation, ExecutionResult } from '@shared/types/chat'
import { CustomError } from '@shared/types/errors'

export async function runPythonCode(
  figuresDirectoryPath: string,
  code: string,
  conversationId: string
): Promise<ExecutionResult> {
  try {
    const result = await window.api.runPythonCode(figuresDirectoryPath, code, conversationId)
    return result
  } catch (error) {
    console.error('Error running Python code at ipcFunctions:', error)
    throw error
  }
}

export async function saveConversationWithPythonResult(
  conversation: Conversation,
  messageId: number,
  executionResult: ExecutionResult
): Promise<{ success: boolean; error?: CustomError }> {
  try {
    const result = await window.api.saveConversationWithPythonResult(
      conversation,
      messageId,
      executionResult
    )
    return result
  } catch (error) {
    console.error('Error saving conversation with Python result at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function getSettingsFromFile(): Promise<Record<string, string> | null> {
  try {
    const settings = await window.api.getSettingsFromFile()
    return settings
  } catch (error) {
    console.error('Error getting settings from file at ipcFunctions:', error)
    return null
  }
}

export async function saveSettingsToFile(
  settings: Record<string, string>
): Promise<{ success: boolean; error?: CustomError }> {
  try {
    const result = await window.api.saveSettingsToFile(settings)
    return result
  } catch (error) {
    console.error('Error saving settings to file at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function saveConversation(
  conversation: Conversation
): Promise<{ success: boolean; error?: CustomError }> {
  try {
    const result = await window.api.saveConversation(conversation)
    return result
  } catch (error) {
    console.error('Error saving conversation at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function loadConversation(
  id: string
): Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }> {
  try {
    const result = await window.api.loadConversation(id)
    return result
  } catch (error) {
    console.error('Error loading conversation at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function createNewConversation(
  title: string
): Promise<{ success: boolean; conversation?: Conversation; error?: CustomError }> {
  try {
    const result = await window.api.createNewConversation(title)
    return result
  } catch (error) {
    console.error('Error creating new conversation at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function appendMessage(
  conversationId: string,
  message: Message
): Promise<{ success: boolean; error?: CustomError }> {
  try {
    const result = await window.api.appendMessage(conversationId, message)
    return result
  } catch (error) {
    console.error('Error appending message at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function listConversations(): Promise<{
  success: boolean
  conversations?: Conversation[]
  error?: CustomError
}> {
  try {
    const result = await window.api.listConversations()
    return result
  } catch (error) {
    console.error('Error listing conversations at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function deleteConversation(
  id: string
): Promise<{ success: boolean; error?: CustomError }> {
  try {
    const result = await window.api.deleteConversation(id)
    return result
  } catch (error) {
    console.error('Error deleting conversation at ipcFunctions:', error)
    return { success: false, error: { message: (error as Error).message } }
  }
}

export async function getConversationImagesDir(conversationId: string): Promise<string> {
  try {
    const result = await window.api.getConversationImagesDir(conversationId)
    return result
  } catch (error) {
    console.error('Error getting conversation images directory at ipcFunctions:', error)
    throw error
  }
}

export async function loadBase64Data(figurePath: string): Promise<string | null> {
  try {
    const result = await window.api.loadBase64Data(figurePath)
    return result
  } catch (error) {
    console.error('Error loading base64 data at ipcFunctions:', error)
    throw error
  }
}
