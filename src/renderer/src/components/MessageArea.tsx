import React, { useRef, useEffect, useState } from 'react'
import { Message } from '@shared/types/chat'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { runPythonCode } from '@renderer/lib/ipcFunctions'
import { Play } from 'lucide-react'

interface MessageAreaProps {
  messages: Message[]
  isStreaming: boolean
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages, isStreaming }) => {
  const messageAreaRef = useRef<HTMLDivElement>(null)
  const [pythonResult, setPythonResult] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    if (isStreaming && messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
    }
  }, [isStreaming, messages])

  const handleRunPython = async (code: string, index: number) => {
    try {
      const result = await runPythonCode(code)
      setPythonResult((prevResults) => ({
        ...prevResults,
        [index]: result
      }))
    } catch (error) {
      setPythonResult((prevResults) => ({
        ...prevResults,
        [index]: 'Error running code'
      }))
    }
  }

  return (
    <div ref={messageAreaRef} className="w-full flex-grow overflow-auto space-y-4 min-h-[50vh]">
      {messages.map((message, index) => (
        <div key={index} className="flex justify-center">
          <div
            className={`p-3 rounded-lg w-4/5 ${
              message.role === 'user'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-black border border-gray-200'
            }`}
          >
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const codeContent = String(children).replace(/\n$/, '')

                  return (
                    <div>
                      {match && match[1] === 'python' && (
                        <div className="flex justify-between items-center mb-2 mt-6">
                          <span className="text-sm font-bold">Python</span>
                          <button
                            onClick={() => handleRunPython(codeContent, index)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                          >
                            <Play size={18} />
                          </button>
                        </div>
                      )}
                      <SyntaxHighlighter style={oneLight} language={match ? match[1] : ''}>
                        {codeContent}
                      </SyntaxHighlighter>
                      {match && match[1] === 'python' && pythonResult[index] && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                          <strong>Result:</strong>
                          <pre className="whitespace-pre-wrap">{pythonResult[index]}</pre>
                        </div>
                      )}
                    </div>
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
