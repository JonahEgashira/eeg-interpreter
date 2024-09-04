// File: src/components/ChatInterface.tsx
import React from 'react'
import { Conversation } from '@shared/types/chat'
import MessageArea from './MessageArea'
import InputArea from './InputArea'

interface ChatInterfaceProps {
  currentConversation: Conversation | null
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
  isStreaming: boolean
  openaiApiKey: string | null
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentConversation,
  input,
  setInput,
  handleSendMessage,
  isStreaming,
  openaiApiKey
}) => {
  return (
    <div className="flex flex-col flex-grow">
      <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-4xl w-full h-full flex flex-col">
          {currentConversation ? (
            <MessageArea messages={currentConversation.messages} isStreaming={isStreaming} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-bold mb-2">New Conversation</h2>
                <p>Start typing below to begin a new conversation.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto w-full">
          <InputArea
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            openaiApiKey={openaiApiKey}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
