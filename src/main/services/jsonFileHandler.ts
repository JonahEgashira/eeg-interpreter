import * as fs from 'fs'
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

const conversationDir = path.join(app.getPath('userData'), 'conversations')

if (!fs.existsSync(conversationDir)) {
  fs.mkdirSync(conversationDir, { recursive: true })
}

export function saveConversation(conversation: Conversation): void {
  const fileName = `${conversation.id}.json`
  const filePath = path.join(conversationDir, fileName)

  const jsonConversation = conversationToJSON(conversation)

  const jsonString = JSON.stringify(jsonConversation, null, 2)
  try {
    fs.writeFileSync(filePath, jsonString)
  } catch (error) {
    console.error(`Error saving conversation ${conversation.id}:`, error)
  }
}

export function loadConversation(id: string): Conversation | null {
  const filePath = path.join(conversationDir, `${id}.json`)
  if (!fs.existsSync(filePath)) return null

  const jsonString = fs.readFileSync(filePath, 'utf-8')
  const json = JSON.parse(jsonString)
  const conversation = conversationFromJSON(json)
  return conversation
}

export function createNewConversation(title: string | null = null): Conversation {
  const newConversation = createConversation(null, title)
  saveConversation(newConversation)
  return newConversation
}

export function appendMessage(conversationId: string, message: Message): void {
  const conversation = loadConversation(conversationId)
  if (conversation) {
    const updatedConversation = addMessage(conversation, message)
    saveConversation(updatedConversation)
  } else {
    console.error(`Conversation with id ${conversationId} not found`)
  }
}

export function listConversations(): Conversation[] {
  const files = fs.readdirSync(conversationDir)
  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const filePath = path.join(conversationDir, file)
      const jsonString = fs.readFileSync(filePath, 'utf-8')
      const json = JSON.parse(jsonString) as ConversationJSON
      return conversationFromJSON(json)
    })
}

export function deleteConversation(id: string): void {
  const filePath = path.join(conversationDir, `${id}.json`)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  } else {
    console.error(`Conversation file with id ${id} not found`)
  }
}
