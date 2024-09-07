import React, { useRef, useEffect, useState } from 'react'
import { Message } from '@shared/types/chat'
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { runPythonCode } from '@renderer/lib/ipcFunctions'
import { Play, Download } from 'lucide-react'

interface MessageAreaProps {
  messages: Message[]
  isStreaming: boolean
}

const CodeBlock: React.FC<{ code: string; language: string; inline: boolean; index: number }> = ({
  code,
  language,
  inline,
  index
}) => {
  const [result, setResult] = useState<string | null>(null)

  const handleRun = async () => {
    try {
      const res = await runPythonCode(code)
      setResult(res)
    } catch (error) {
      setResult('Error running code')
    }
  }

  if (inline) {
    return (
      <code key={index} className="bg-gray-200 rounded px-1 py-0.5 text-sm">
        {code}
      </code>
    )
  }

  const getImageDownloadLink = (htmlString: string): string | undefined => {
    const imgTagMatch = htmlString.match(/<img\s+src="data:image\/png;base64,([^"]+)"\s*.*?>/)
    if (imgTagMatch && imgTagMatch[1]) {
      return `data:image/png;base64,${imgTagMatch[1]}`
    }
    return undefined
  }

  return (
    <div>
      {language === 'python' && (
        <div className="flex justify-between items-center mb-2 mt-6">
          <span className="text-sm font-bold">Python</span>
          <button onClick={handleRun} className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
            <Play size={18} />
          </button>
        </div>
      )}
      <SyntaxHighlighter PreTag="div" style={oneLight} language={language}>
        {code}
      </SyntaxHighlighter>
      {language === 'python' && result && (
        <div className="mt-2 p-2 bg-gray-100 rounded">
          <div className="mb-2 flex justify-between items-center">
            <strong>Result</strong>
            {getImageDownloadLink(result) && (
              <a
                href={getImageDownloadLink(result)}
                download={`python_output_${index}.png`}
                className="text-black underline flex items-center"
              >
                <Download size={20} />
              </a>
            )}
          </div>
          <div dangerouslySetInnerHTML={{ __html: result }} />
        </div>
      )}
    </div>
  )
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages, isStreaming }) => {
  const messageAreaRef = useRef<HTMLDivElement>(null)

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
                ? 'bg-gray-700 text-white'
                : 'bg-white text-black border border-gray-200'
            }`}
          >
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
                      code={codeContent}
                      language={language}
                      inline={inline}
                      index={index}
                      {...rest}
                    />
                  )
                }
              }}
            >
              {message.content}
            </Markdown>
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
