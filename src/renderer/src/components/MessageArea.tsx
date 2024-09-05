import React, { useRef, useEffect } from 'react'
import { Message } from '@shared/types/chat'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

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
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  console.log('message.content', message.content)
                  const match = /language-(\w+)/.exec(className || '')

                  const codeContent = String(children).replace(/\n$/, '')

                  if (!className?.includes('inline') && match) {
                    if (codeContent.trim() === '') {
                      return <div className="h-4"></div>
                    }
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        className={message.role === 'user' ? 'bg-gray-800' : ''}
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                    )
                  }
                  return (
                    <code
                      className={`px-1 rounded ${message.role === 'user' ? 'bg-gray-700' : 'bg-gray-200'}`}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
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
