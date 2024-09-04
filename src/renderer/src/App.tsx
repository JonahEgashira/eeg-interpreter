import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { streamText, generateText } from 'ai'
import { Message, Conversation } from '@shared/types/chat'
import { getEnvVar, saveConversation } from './lib/ipcFunctions'
import { Send } from 'lucide-react'
import { createOpenAI } from '@ai-sdk/openai'
import { InputSchema } from './lib/chat/inputSchema'
import Sidebar from './components/Sidebar'
import { addMessage } from '@shared/types/chat'
import { loadConversation, createNewConversation, listConversations } from './lib/ipcFunctions'

const App = (): JSX.Element => {
  const [input, setInput] = React.useState<string>('')
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = React.useState<Conversation | null>(null)
  const [isComposing, setIsComposing] = React.useState(false)
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

        const result = await createNewConversation(generatedTitle.text)

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onNewConversation={handleNewConversation}
        onLoadConversation={handleLoadConversation}
      />
      <div className="flex flex-col flex-grow">
        <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
          <div className="max-w-4xl w-full h-full flex flex-col">
            <div
              ref={messageAreaRef}
              className="w-full flex-grow overflow-auto space-y-4 min-h-[50vh]"
            >
              {currentConversation?.messages.map((message, index) => (
                <div key={index} className="flex justify-center">
                  <div
                    className={`p-3 rounded-lg w-4/5 ${
                      message.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-white text-black border border-gray-200'
                    }`}
                  >
                    {message.content}
                    {message.role === 'assistant' &&
                      isStreaming &&
                      index === currentConversation.messages.length - 1 && (
                        <span className="text-gray-500 animate-pulse">...</span>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center space-x-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="Type your message..."
                className="flex-grow p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-black"
                minRows={1}
                maxRows={3}
                autoFocus
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-black text-white rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
                disabled={!input.trim() || !openaiApiKey || isStreaming}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
