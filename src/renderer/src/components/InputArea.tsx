import React, { useRef, useEffect, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { Send } from 'lucide-react'

interface InputAreaProps {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
  isStreaming: boolean
  openaiApiKey: string | null
}

const InputArea: React.FC<InputAreaProps> = ({
  input,
  setInput,
  handleSendMessage,
  isStreaming,
  openaiApiKey
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
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
  )
}

export default InputArea
