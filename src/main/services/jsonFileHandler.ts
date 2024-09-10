import * as fs from 'fs/promises'
import * as path from 'path'
import {
  Conversation,
  ConversationJSON,
  Message,
  conversationFromJSON,
  conversationToJSON,
  createConversation,
  addMessage
} from '@shared/types/chat'
import { app } from 'electron'

const baseConversationDir = path.join(app.getPath('userData'), 'conversations')

async function createConversationFolders(conversationId: string): Promise<void> {
  const conversationDir = path.join(baseConversationDir, conversationId)
  const figuresDir = path.join(conversationDir, 'base64')
  const filesDir = path.join(conversationDir, 'files')

  try {
    await fs.mkdir(conversationDir, { recursive: true })
    await fs.mkdir(figuresDir, { recursive: true })
    await fs.mkdir(filesDir, { recursive: true })
  } catch (error) {
    console.error('Error creating conversation directories:', error)
    throw error
  }
}

function getConversationDir(conversationId: string): string {
  return path.join(baseConversationDir, conversationId)
}

function getConversationFilePath(conversationId: string): string {
  return path.join(getConversationDir(conversationId), 'conversation.json')
}

export function getConversationImagesDir(conversationId: string): string {
  return path.join(getConversationDir(conversationId), 'base64')
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const filePath = getConversationFilePath(conversation.id)

  try {
    await createConversationFolders(conversation.id)

    const jsonConversation = conversationToJSON(conversation)
    const jsonString = JSON.stringify(jsonConversation, null, 2)

    await fs.writeFile(filePath, jsonString)
  } catch (error) {
    console.error(`Error saving conversation ${conversation.id}:`, error)
    throw error
  }
}

export async function loadConversation(id: string): Promise<Conversation | null> {
  const filePath = getConversationFilePath(id)

  try {
    const jsonString = await fs.readFile(filePath, 'utf-8')
    const json = JSON.parse(jsonString)
    return conversationFromJSON(json)
  } catch (error) {
    console.error(`Error loading conversation ${id}:`, error)
    return null
  }
}

export async function createNewConversation(title: string): Promise<Conversation> {
  const newConversation = createConversation(null, title)
  await saveConversation(newConversation)

  return newConversation
}

export async function appendMessage(conversationId: string, message: Message): Promise<void> {
  const conversation = await loadConversation(conversationId)
  if (conversation) {
    const updatedConversation = addMessage(conversation, message)
    await saveConversation(updatedConversation)
  } else {
    console.error(`Conversation with id ${conversationId} not found`)
  }
}

export async function listConversations(): Promise<Conversation[]> {
  try {
    const directories = await fs.readdir(baseConversationDir)

    const validDirectories = await Promise.all(
      directories.map(async (dir) => {
        const dirPath = path.join(baseConversationDir, dir)
        try {
          const stat = await fs.stat(dirPath)
          return stat.isDirectory() ? dir : null
        } catch {
          return null
        }
      })
    )

    const filteredDirectories = validDirectories.filter((dir) => dir !== null)

    const conversations = await Promise.all(
      filteredDirectories.map(async (dir) => {
        const filePath = getConversationFilePath(dir as string)
        try {
          const jsonString = await fs.readFile(filePath, 'utf-8')
          const json = JSON.parse(jsonString) as ConversationJSON
          return conversationFromJSON(json)
        } catch (error) {
          console.error(`Error loading conversation from ${filePath}:`, error)
          return null
        }
      })
    )

    const result = conversations.filter((conv) => conv !== null) as Conversation[]
    return result
  } catch (error) {
    console.error('Error listing conversations:', error)
    return []
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const conversationDir = getConversationDir(id)
  try {
    await fs.rm(conversationDir, { recursive: true, force: true })
  } catch (error) {
    console.error(`Failed to delete conversation with id ${id}:`, error)
  }
}

async function ensureBaseDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(baseConversationDir, { recursive: true })
  } catch (error) {
    console.error('Error creating base conversation directory:', error)
  }
}

ensureBaseDirectoryExists().catch(console.error)
