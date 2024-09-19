import React from 'react'
import { Conversation, ExecutionResult } from '@shared/types/chat'
import MessageArea from './MessageArea'
import InputArea from './InputArea'
import { OpenAIModel } from '@shared/types/chat'
import { SystemPrompt } from '@renderer/lib/config/prompts'

interface ChatInterfaceProps {
  currentConversation: Conversation | null
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
  handleExecutionResult: (
    messageId: number,
    result: ExecutionResult,
    isLastMessage: boolean,
    prompt: SystemPrompt
  ) => void
  handleFileSelect: (filePaths: string[]) => void
  selectedFiles: string[]
  textAreaRef: React.RefObject<HTMLTextAreaElement>
  isStreaming: boolean
  openaiApiKey: string | null
  model: OpenAIModel
  onModelChange: (newModel: OpenAIModel) => void
  systemPrompt: SystemPrompt
  onSystemPromptChange: (newPrompt: SystemPrompt) => void
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentConversation,
  input,
  setInput,
  handleSendMessage,
  handleExecutionResult,
  handleFileSelect,
  selectedFiles,
  textAreaRef,
  isStreaming,
  openaiApiKey,
  model,
  onModelChange,
  systemPrompt,
  onSystemPromptChange
}) => {
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as OpenAIModel
    onModelChange(newModel)
  }

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrompt = e.target.value as SystemPrompt
    onSystemPromptChange(newPrompt)
  }

  return (
    <div className="flex flex-col flex-grow">
      <div className="absolute top-4 right-4">
        <select
          value={model}
          onChange={handleModelChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {Object.values(OpenAIModel).map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <select
          value={systemPrompt}
          onChange={handleSystemPromptChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {Object.values(SystemPrompt).map((prompt) => (
            <option key={prompt} value={prompt}>
              {prompt}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-4xl w-full h-full flex flex-col">
          {currentConversation ? (
            <MessageArea
              conversation={currentConversation}
              messages={currentConversation.messages}
              isStreaming={isStreaming}
              handleExecutionResult={handleExecutionResult}
            />
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
            handleFileSelect={handleFileSelect}
            selectedFiles={selectedFiles}
            isStreaming={isStreaming}
            openaiApiKey={openaiApiKey}
            textAreaRef={textAreaRef}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
