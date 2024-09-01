import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { generateResponse, InputSchema } from '@renderer/lib/chat/llm'
import { Message } from '@shared/types/chat'
import { getEnvVar, runPythonCode } from './lib/ipcFunctions'

function App(): JSX.Element {
  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [openaiApiKey, setOpenaiApiKey] = React.useState<string | null>(null)

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

  const handleSendMessage = async () => {
    const userMessage = input.trim()
    if (!userMessage || !openaiApiKey) return

    try {
      const parsedUserMessage = InputSchema.parse({ input: userMessage })

      const newUserMessage: Message = { role: 'user', content: parsedUserMessage.input }
      setMessages((prevMessages) => [...prevMessages, newUserMessage])
      setInput('')
      setIsLoading(true)

      const aiResponse = await generateResponse([...messages, newUserMessage], openaiApiKey)

      const newAIMessage: Message = { role: 'assistant', content: aiResponse }
      setMessages((prevMessages) => [...prevMessages, newAIMessage])
    } catch (error) {
      console.error('Error processing input:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunPythonHelloWorld = async () => {
    try {
      setIsLoading(true)
      const result = await runPythonCode('print("Hello, World!")')
      console.log('Python output:', result)

      setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: result }])
    } catch (error) {
      console.error('Error running Python code:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-md ${
              message.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Type your message and press Enter..."
          className="flex-grow p-2 border rounded-md resize-none mr-2"
          minRows={1}
          maxRows={5}
          autoFocus
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </div>

      <button
        onClick={handleRunPythonHelloWorld}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md disabled:opacity-50"
        disabled={isLoading}
      >
        Run Python Hello World
      </button>
    </div>
  )
}

export default App
