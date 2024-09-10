import { Message, Conversation, ExecutionResult } from '@shared/types/chat'
import { CustomError } from '@shared/types/errors'

export async function runPythonCode(
  figuresDirectoryPath: string,
  code: string
): Promise<ExecutionResult> {
  try {
    const result = await window.api.runPythonCode(figuresDirectoryPath, code)
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

export async function getEnvVar(key: string): Promise<string | null> {
  try {
    const value = await window.api.getEnvVar(key)
    return value
  } catch (error) {
    console.error('Error getting environment variable at ipcFunctions:', error)
    throw error
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
