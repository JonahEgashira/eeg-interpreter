import React, { useRef, useEffect, useState, useCallback, memo } from 'react'
import { Conversation, Message, ExecutionResult } from '@shared/types/chat'
import { loadBase64Data } from '@renderer/lib/ipcFunctions'
import MessageCard, { MessageTypeEnum } from './MessageCard'
import { SystemPrompt } from '@renderer/lib/config/prompts'

interface MessageAreaProps {
  conversation: Conversation
  messages: Message[]
  isStreaming: boolean
  handleExecutionResult: (
    messageId: number,
    result: ExecutionResult,
    isLastMessage: boolean,
    prompt: SystemPrompt
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
        {messages.map((message, messageIndex) => {
          let messageType =
            message.role === 'user' ? MessageTypeEnum.User : MessageTypeEnum.Assistant
          if (message.isExecutionMessage) {
            messageType = MessageTypeEnum.ExecutionResult
          }
          return (
            <MessageCard
              key={message.id}
              message={message}
              messageType={messageType}
              conversation={conversation}
              messageIndex={messageIndex}
              isStreaming={isStreaming}
              base64Images={base64Images[conversationMessageId(conversation.id, message.id)] || []}
              handleExecutionResult={handleExecutionResult}
              handleBase64Update={handleBase64Update}
            />
          )
        })}
      </div>
    )
  }
)

MessageArea.displayName = 'MessageArea'

export default MessageArea
