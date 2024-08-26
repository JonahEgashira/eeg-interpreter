import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { createOpenAI } from '@ai-sdk/openai'
import { processInput } from '@renderer/lib/chat/llm'

function App(): JSX.Element {
  const [input, setInput] = React.useState<string>('')
  const [messages, setMessages] = React.useState<{ id: string; text: string; isUser: boolean }[]>(
    []
  )
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

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: String(Date.now()), text: userMessage, isUser: true }
      ])

      setInput('')

      try {
        const openai = await openaiInstance
        const aiResponse = await processInput(userMessage, openai)

        setMessages((prevMessages) => [
          ...prevMessages,
          { id: String(Date.now()), text: aiResponse, isUser: false }
        ])
      } catch (error) {
        console.error('Error processing input:', error)
      }
    }
  }

  const runHelloWorldPython = async () => {
    try {
      const result = await window.api.runPythonCode('print("Hello, World!")')
      console.log('Python output:', result)

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: String(Date.now()), text: result, isUser: false }
      ])
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-md ${
              message.isUser ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'
            }`}
          >
            {message.text}
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
