import * as React from 'react'
import { streamText, generateText } from 'ai'
import { Message, Conversation } from '@shared/types/chat'
import { getEnvVar, saveConversation } from './lib/ipcFunctions'
import { createOpenAI } from '@ai-sdk/openai'
import { InputSchema } from './lib/chat/inputSchema'
import Sidebar from './components/Sidebar'
import { addMessage } from '@shared/types/chat'
import { loadConversation, createNewConversation, listConversations } from './lib/ipcFunctions'
import ChatInterface from './components/ChatInterface'

const App = (): JSX.Element => {
  const [input, setInput] = React.useState<string>('')
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = React.useState<Conversation | null>(null)
  const [openaiApiKey, setOpenaiApiKey] = React.useState<string | null>(null)
  const [isStreaming, setIsStreaming] = React.useState(false)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const messageAreaRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const fetchOpenaiApiKey = async () => {
      try {
        const apiKey = await getEnvVar('OPENAI_API_KEY')
        setOpenaiApiKey(apiKey)
      } catch (error) {
        console.error('Error fetching OpenAI API key:', error)
      }
    }

    fetchOpenaiApiKey()
    loadConversations()
  }, [])

  React.useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
    }
  }, [currentConversation?.messages])

  React.useEffect(() => {
    textareaRef.current?.focus()
  }, [currentConversation])

  const loadConversations = async () => {
    try {
      const result = await listConversations()
      if (result.success && result.conversations) {
        setConversations(result.conversations)
      } else {
        console.error('Failed to load conversations:', result.error)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleNewConversation = async () => {
    setCurrentConversation(null)
    setInput('')
  }

  const handleLoadConversation = async (id: string) => {
    try {
      const result = await loadConversation(id)
      if (result.success && result.conversation) {
        setCurrentConversation(result.conversation)
      } else {
        console.error('Failed to load conversation:', result.error)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleSendMessage = async () => {
    const userMessage = input.trim()
    if (!userMessage || !openaiApiKey) return

    try {
      const parsedUserMessage = InputSchema.parse({ input: userMessage })
      const newUserMessage: Message = { role: 'user', content: parsedUserMessage.input }

      const openai = createOpenAI({ apiKey: openaiApiKey })

      let updatedConversation: Conversation

      if (!currentConversation) {
        const generatedTitle = await generateText({
          model: openai('gpt-4o-mini'),
          prompt: `Please generate a short, concise title for the following conversation:\n\n${parsedUserMessage.input}`
        })

        const cleanTitle = generatedTitle.text.replace(/^["']|["']$/g, '').trim()

        const result = await createNewConversation(cleanTitle)

        if (!result.success || !result.conversation) {
          throw new Error('Failed to create new conversation')
        }
        updatedConversation = result.conversation
      } else {
        updatedConversation = { ...currentConversation }
      }

      updatedConversation = addMessage(updatedConversation, newUserMessage)

      setCurrentConversation(updatedConversation)
      setInput('')
      setIsStreaming(true)

      const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: 'You are a helpful assistant.',
        messages: updatedConversation.messages
      })

      let fullResponse = ''
      const newAIMessage: Message = { role: 'assistant', content: '' }

      for await (const delta of result.textStream) {
        fullResponse += delta
        setCurrentConversation((prev) => {
          if (prev) {
            const updatedMessages = [...prev.messages]
            if (updatedMessages[updatedMessages.length - 1].role === 'assistant') {
              updatedMessages[updatedMessages.length - 1].content = fullResponse
            } else {
              updatedMessages.push({ ...newAIMessage, content: fullResponse })
            }
            return { ...prev, messages: updatedMessages, updatedAt: new Date() }
          }
          return prev
        })
      }

      setIsStreaming(false)

      updatedConversation = addMessage(updatedConversation, {
        ...newAIMessage,
        content: fullResponse
      })

      await saveConversation(updatedConversation)

      setConversations((prevConversations) => {
        const existingIndex = prevConversations.findIndex((c) => c.id === updatedConversation.id)
        if (existingIndex !== -1) {
          return [
            updatedConversation,
            ...prevConversations.slice(0, existingIndex),
            ...prevConversations.slice(existingIndex + 1)
          ]
        } else {
          return [updatedConversation, ...prevConversations]
        }
      })

      textareaRef.current?.focus()
    } catch (error) {
      console.error('Error processing input:', error)
      setIsStreaming(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onNewConversation={handleNewConversation}
        onLoadConversation={handleLoadConversation}
      />
      <ChatInterface
        currentConversation={currentConversation}
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        openaiApiKey={openaiApiKey}
      />
    </div>
  )
}

export default App
