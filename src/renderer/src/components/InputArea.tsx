import React, { useEffect, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { Send, Paperclip, File } from 'lucide-react'

interface InputAreaProps {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
  handleFileSelect: (filePaths: string[]) => void
  selectedFiles: string[]
  isStreaming: boolean
  openaiApiKey: string | null
  textAreaRef: React.RefObject<HTMLTextAreaElement>
}

const InputArea: React.FC<InputAreaProps> = ({
  input,
  setInput,
  handleSendMessage,
  handleFileSelect,
  selectedFiles,
  isStreaming,
  openaiApiKey,
  textAreaRef
}) => {
  const [isComposing, setIsComposing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    textAreaRef.current?.focus()
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

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const files = event.dataTransfer.files
    if (files) {
      const filePaths = Array.from(files).map((file) => file.path)
      handleFileSelect(filePaths)
    }
  }

  return (
    <div
      className={`flex flex-col items-start space-y-2 border ${isDragging ? 'border-blue-500' : 'border-transparent'} rounded-md p-4`} // Add more padding (p-4)
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap space-x-2 mb-2">
          {selectedFiles.map((filePath, index) => (
            <div key={index} className="flex items-center p-1 bg-gray-200 rounded-md space-x-1">
              <File size={16} /> {/* Add file icon here */}
              <span className="text-sm truncate max-w-xs" title={filePath}>
                {filePath.split('/').pop()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center w-full space-x-2">
        {' '}
        {/* Add space-x-2 for more gap between elements */}
        <label className="p-2 bg-gray-200 text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 transition-colors">
          <Paperclip size={22} />
          <input type="file" onChange={handleFileChange} className="hidden" multiple />
        </label>
        <Textarea
          ref={textAreaRef}
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
    </div>
  )
}

export default InputArea
