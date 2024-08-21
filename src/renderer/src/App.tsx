import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { processInput } from '@renderer/lib/chat/llm'

function App(): JSX.Element {
  const [input, setInput] = React.useState<string>('')
  const [messages, setMessages] = React.useState<{ id: string; text: string; isUser: boolean }[]>(
    []
  )

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      const userMessage = input.trim()
      if (userMessage === '') return

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: String(Date.now()), text: userMessage, isUser: true }
      ])

      setInput('')

      try {
        const aiResponse = await processInput(userMessage)

        setMessages((prevMessages) => [
          ...prevMessages,
          { id: String(Date.now()), text: aiResponse, isUser: false }
        ])
      } catch (error) {
        console.error('Error processing input:', error)
      }
    }
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
        placeholder="Type your message and press Enter..."
        className="mt-4 w-full p-2 border rounded-md resize-none"
        minRows={1}
        maxRows={5}
        autoFocus
      />
    </div>
  )
}

export default App
