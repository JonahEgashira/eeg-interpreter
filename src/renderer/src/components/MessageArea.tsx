import React, { useRef, useEffect } from 'react'
import { Message } from '@shared/types/chat'

interface MessageAreaProps {
  messages: Message[]
  isStreaming: boolean
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages, isStreaming }) => {
  const messageAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div ref={messageAreaRef} className="w-full flex-grow overflow-auto space-y-4 min-h-[50vh]">
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
  )
}

export default MessageArea
