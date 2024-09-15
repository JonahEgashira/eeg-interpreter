import React from 'react'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Markdown from 'react-markdown'
import { File } from 'lucide-react'
import CodeBlock from './CodeBlock'
import { Message as MessageType, Conversation, ExecutionResult } from '@shared/types/chat'

export enum MessageTypeEnum {
  User = 'user',
  Assistant = 'assistant',
  ExecutionResult = 'executionResult'
}

interface MessageProps {
  message: MessageType
  messageType: MessageTypeEnum
  conversation: Conversation
  messageIndex: number
  isStreaming: boolean
  base64Images: string[]
  handleExecutionResult: (
    messageId: number,
    result: ExecutionResult,
    isLastMessage: boolean
  ) => void
  handleBase64Update: (conversationId: string, messageId: number, base64: string[]) => void
}

const MessageCard: React.FC<MessageProps> = ({
  message,
  messageType,
  conversation,
  messageIndex,
  isStreaming,
  base64Images,
  handleExecutionResult,
  handleBase64Update
}) => {
  const isLastMessage = messageIndex === conversation.messages.length - 1

  const renderMessageContent = () => {
    switch (messageType) {
      case MessageTypeEnum.User:
        return (
          <div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
            {message.filePaths && message.filePaths.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.filePaths.map((filePath, fileIndex) => (
                  <div key={fileIndex} className="flex items-center space-x-2">
                    <File size={32} />
                    <span className="text-white">{filePath.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case MessageTypeEnum.Assistant:
        return (
          <Markdown
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || '')
                const codeContent = String(children).replace(/\n$/, '')
                const language = match ? match[1] : ''
                const inline = !className

                return (
                  <CodeBlock
                    conversation={conversation}
                    messageId={message.id}
                    code={codeContent}
                    handleExecutionResult={handleExecutionResult}
                    language={language}
                    inline={inline}
                    messageIndex={messageIndex}
                    base64Images={base64Images}
                    handleBase64Update={handleBase64Update}
                    isLastMessage={isLastMessage}
                  />
                )
              }
            }}
          >
            {message.content}
          </Markdown>
        )

      case MessageTypeEnum.ExecutionResult:
        return (
          <div>
            <pre className="whitespace-pre-wrap text-green-400 font-mono text-sm">
              {message.content}
            </pre>
            {base64Images.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {base64Images.map((img, index) => (
                  <div key={index} className="border border-gray-700 rounded-md overflow-hidden">
                    <img
                      src={`data:image/png;base64,${img}`}
                      alt={`result-${index}`}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="flex justify-center">
      <div
        className={`p-3 rounded-lg w-4/5 ${
          messageType === MessageTypeEnum.User || messageType === MessageTypeEnum.ExecutionResult
            ? 'bg-black text-white'
            : 'bg-white text-black border border-gray-200'
        }`}
      >
        {renderMessageContent()}
        {messageType === MessageTypeEnum.Assistant && isStreaming && isLastMessage && (
          <span className="text-gray-500 animate-pulse">...</span>
        )}
      </div>
    </div>
  )
}

export default MessageCard
