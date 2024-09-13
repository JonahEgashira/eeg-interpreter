import React, { useRef, useEffect, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { Send, Paperclip } from 'lucide-react'

interface InputAreaProps {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
  handleFileSelect: (filePaths: string[]) => void
  isStreaming: boolean
  openaiApiKey: string | null
}

const InputArea: React.FC<InputAreaProps> = ({
  input,
  setInput,
  handleSendMessage,
  handleFileSelect,
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const filePaths = Array.from(files).map((file) => file.path)
      handleFileSelect(filePaths)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="p-2 bg-gray-200 text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 transition-colors">
        <Paperclip size={22} />
        <input type="file" onChange={handleFileChange} className="hidden" multiple />
      </label>
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
        <Send size={22} />
      </button>
    </div>
  )
}

export default InputArea
