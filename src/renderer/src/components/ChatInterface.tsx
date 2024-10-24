import React, { useState } from 'react'
import { Conversation, ExecutionResult } from '@shared/types/chat'
import MessageArea from './MessageArea'
import InputArea from './InputArea'
import { LLMModel } from '@shared/types/chat'
import { SystemPrompt } from '@renderer/lib/config/prompts'
import { Switch } from '@headlessui/react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid'

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
  model: LLMModel
  onModelChange: (newModel: LLMModel) => void
  systemPrompt: SystemPrompt
  onSystemPromptChange: (newPrompt: SystemPrompt) => void
  autoAssistantEnabled: boolean
  setAutoAssistantEnabled: (enabled: boolean) => void
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
  model,
  onModelChange,
  systemPrompt,
  onSystemPromptChange,
  autoAssistantEnabled,
  setAutoAssistantEnabled
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as LLMModel
    onModelChange(newModel)
  }

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrompt = e.target.value as SystemPrompt
    onSystemPromptChange(newPrompt)
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="flex flex-col flex-grow">
      <div className="absolute top-4 right-4 bg-white p-2 rounded shadow flex flex-col items-end">
        <button
          onClick={toggleExpand}
          className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
        {isExpanded && (
          <div className="space-y-4 mt-2">
            {/* Model Selector */}
            <select
              value={model}
              onChange={handleModelChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {Object.values(LLMModel).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>

            {/* System Prompt Selector */}
            <select
              value={systemPrompt}
              onChange={handleSystemPromptChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {Object.values(SystemPrompt).map((prompt) => (
                <option key={prompt} value={prompt}>
                  {prompt}
                </option>
              ))}
            </select>

            {/* Auto Assistant Toggle */}
            <div className="flex items-center">
              <Switch
                checked={autoAssistantEnabled}
                onChange={setAutoAssistantEnabled}
                className={`${
                  autoAssistantEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full`}
              >
                <span className="sr-only">Enable Auto Assistant</span>
                <span
                  className={`${
                    autoAssistantEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                />
              </Switch>
              <span className="ml-2 text-sm">Auto Assistant</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-5xl w-full h-full flex flex-col">
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
            textAreaRef={textAreaRef}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
