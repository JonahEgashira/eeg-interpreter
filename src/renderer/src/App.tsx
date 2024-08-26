import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { createOpenAI } from '@ai-sdk/openai'
import { generateResponse, type Message } from '@renderer/lib/chat/llm'

function App(): JSX.Element {
  const [input, setInput] = React.useState<string>('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isComposing, setIsComposing] = React.useState(false)

  const openaiInstance = React.useMemo(async () => {
    try {
      const apiKey = await window.api.getEnvVar('OPENAI_API_KEY')
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not found in environment variables')
      }
      return createOpenAI({ apiKey: apiKey })
    } catch (error) {
      console.error('Error initializing OpenAI:', error)
      throw error
    }
  }, [])

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault()

      const userMessage = input.trim()
      if (userMessage === '') return

      const newUserMessage: Message = { role: 'user', content: userMessage }

      setMessages((prevMessages) => [...prevMessages, newUserMessage])

      setInput('')

      try {
        const openai = await openaiInstance

        const aiResponse = await generateResponse([...messages, newUserMessage], openai)

        const newAIMessage: Message = { role: 'assistant', content: aiResponse }

        setMessages((prevMessages) => [...prevMessages, newAIMessage])
      } catch (error) {
        console.error('Error processing input:', error)
      }
    }
  }

  const runHelloWorldPython = async () => {
    try {
      const result = await window.api.runPythonCode('print("Hello, World!")')
      console.log('Python output:', result)

      setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: result }])
    } catch (error) {
      console.error('Error running Python code:', error)
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
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

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="Type your message and press Enter..."
        className="mt-4 w-full p-2 border rounded-md resize-none"
        minRows={1}
        maxRows={5}
        autoFocus
      />

      <button
        onClick={runHelloWorldPython}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Run Python Hello World
      </button>
    </div>
  )
}

export default App
