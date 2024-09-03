import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { streamText } from 'ai'
import { Message } from '@shared/types/chat'
import { appendMessage, getEnvVar } from './lib/ipcFunctions'
import { Send } from 'lucide-react'
import { createOpenAI } from '@ai-sdk/openai'
import { InputSchema } from './lib/chat/inputSchema'

function App(): JSX.Element {
  const [input, setInput] = React.useState<string>('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isComposing, setIsComposing] = React.useState(false)
  const [openaiApiKey, setOpenaiApiKey] = React.useState<string | null>(null)
  const [isStreaming, setIsStreaming] = React.useState(false)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

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
  }, [])

  React.useEffect(() => {
    textareaRef.current?.focus()
  }, [messages])

  const handleSendMessage = async () => {
    const userMessage = input.trim()
    if (!userMessage || !openaiApiKey) return

    try {
      const parsedUserMessage = InputSchema.parse({ input: userMessage })
      const newUserMessage: Message = { role: 'user', content: parsedUserMessage.input }
      setMessages((prevMessages) => [...prevMessages, newUserMessage])
      setInput('')
      setIsStreaming(true)

      const openai = createOpenAI({ apiKey: openaiApiKey })

      const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: 'You are a helpful assistant.',
        messages: [...messages, newUserMessage]
      })

      let fullResponse = ''
      const newAIMessage: Message = { role: 'assistant', content: '' }
      setMessages((prevMessages) => [...prevMessages, newAIMessage])

      for await (const delta of result.textStream) {
        fullResponse += delta
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages]
          updatedMessages[updatedMessages.length - 1].content = fullResponse
          return updatedMessages
        })
      }

      setIsStreaming(false)
      appendMessage(newUserMessage)
      appendMessage({ ...newAIMessage, content: fullResponse })

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
    <div className="flex w-full flex-col h-screen bg-gray-100">
      <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-4xl w-full h-full flex flex-col">
          <div className="w-full flex-grow overflow-auto space-y-4 min-h-[50vh]">
            {messages.map((message, index) => (
              <div key={index} className="flex justify-center">
                <div
                  className={`p-3 rounded-lg w-4/5 ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-gray-200'
                  }`}
                >
                  {message.content}
                  {message.role === 'assistant' && isStreaming && index === messages.length - 1 && (
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
  )
}

export default App
