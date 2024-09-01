import * as fs from 'fs'
import * as path from 'path'
import { Conversation, Message } from '@shared/types/chat'
import { app } from 'electron'

const filePath = path.join(app.getPath('userData'), 'conversation.json')

export function saveConversationFile(conversation: Conversation): void {
  const jsonString = JSON.stringify(conversation.toJSON(), null, 2)
  fs.writeFileSync(filePath, jsonString)
}

export function loadConversationFromFile(): Conversation | null {
  if (!fs.existsSync(filePath)) {
    return null
  }

  const jsonString = fs.readFileSync(filePath, 'utf-8')
  const json = JSON.parse(jsonString)
  return Conversation.fromJSON(json)
}

export function appendMessageToFile(message: Message): void {
  const conversation = loadConversationFromFile()

  if (conversation) {
    conversation.addMessage(message)
    saveConversationFile(conversation)
  } else {
    const newConversation = new Conversation('My Conversation', [message])
    saveConversationFile(newConversation)
  }
}
