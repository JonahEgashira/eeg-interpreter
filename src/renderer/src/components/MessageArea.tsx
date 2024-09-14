import React, { useRef, useEffect, useState, useCallback, memo } from 'react'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Conversation, Message, ExecutionResult } from '@shared/types/chat'
import Markdown from 'react-markdown'
import CodeBlock from './CodeBlock'
import { loadBase64Data } from '@renderer/lib/ipcFunctions'
import { File } from 'lucide-react'

interface MessageAreaProps {
  conversation: Conversation
  messages: Message[]
  isStreaming: boolean
  handleExecutionResult: (
    messageId: number,
    result: ExecutionResult,
    isLastMessage: boolean
  ) => void
}

const conversationMessageId = (conversationId: string, messageId: number) =>
  `${conversationId}-${messageId}`

const MessageArea: React.FC<MessageAreaProps> = memo(
  ({ conversation, messages, isStreaming, handleExecutionResult }) => {
    const messageAreaRef = useRef<HTMLDivElement>(null)

    const [base64Images, setBase64Images] = useState<Record<string, string[]>>({})

    const handleBase64Update = useCallback(
      (conversationId: string, messageId: number, base64: string[]) => {
        const key = conversationMessageId(conversationId, messageId)
        setBase64Images((prevState) => ({
          ...prevState,
          [key]: base64
        }))
      },
      []
    )

    useEffect(() => {
      const loadImagesForMessages = async () => {
        const imagePromises = messages.map(async (message) => {
          if (message.executionResult?.figurePaths) {
            const base64Images = (
              await Promise.all(message.executionResult.figurePaths.map(loadBase64Data))
            ).filter((base64) => base64 !== null) as string[]

            if (base64Images.length > 0) {
              handleBase64Update(conversation.id, message.id, base64Images)
            }
          }
        })

        await Promise.all(imagePromises)
      }

      loadImagesForMessages()
    }, [messages, handleBase64Update])

    useEffect(() => {
      if (isStreaming && messageAreaRef.current) {
        messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
      }
    }, [isStreaming, messages])

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
              {message.role === 'user' ? (
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
              ) : (
                <Markdown
                  rehypePlugins={[rehypeRaw]}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...rest }) {
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
                          index={index}
                          base64Images={
                            base64Images[conversationMessageId(conversation.id, message.id)] || []
                          }
                          handleBase64Update={handleBase64Update}
                          {...rest}
                        />
                      )
                    }
                  }}
                >
                  {message.content}
                </Markdown>
              )}
              {message.role === 'assistant' && isStreaming && index === messages.length - 1 && (
                <span className="text-gray-500 animate-pulse">...</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
)

MessageArea.displayName = 'MessageArea'

export default MessageArea
