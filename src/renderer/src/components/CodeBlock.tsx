import React, { useMemo, memo, useEffect, useState } from 'react'
import { runPythonCode } from '@renderer/lib/ipcFunctions'
import { Play, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Conversation, Message } from '@shared/types/chat'
import { ExecutionResult } from '@shared/types/chat'
import {
  saveConversationWithPythonResult,
  getConversationImagesDir,
  loadBase64Data
} from '@renderer/lib/ipcFunctions'
import ImageDisplay from './ImageDisplay'
import { SystemPrompt } from '@renderer/lib/config/prompts'

interface CodeBlockProps {
  conversation: Conversation
  message: Message
  code: string
  handleExecutionResult: (
    messageId: number,
    result: ExecutionResult,
    isLastMessage: boolean,
    prompt: SystemPrompt
  ) => void
  language: string
  inline: boolean
  messageIndex: number
  base64Images: string[]
  handleBase64Update: (conversationId: string, messageId: number, base64: string[]) => void
  isLastMessage: boolean
}

const CodeBlock: React.FC<CodeBlockProps> = memo(
  ({
    conversation,
    message,
    code,
    handleExecutionResult,
    language,
    inline,
    messageIndex,
    base64Images,
    handleBase64Update,
    isLastMessage
  }) => {
    const [isCopied, setIsCopied] = useState(false)

    const executionResult = useMemo(() => {
      return conversation?.messages.find((m) => m.id === message.id && m.executionResult)
        ?.executionResult
    }, [conversation, message.id])

    const handleRun = async () => {
      try {
        const figureDir = await getConversationImagesDir(conversation.id)
        const result = await runPythonCode(figureDir, code, conversation.id)
        await saveConversationWithPythonResult(conversation, message.id, result)

        if (result.figurePaths) {
          const base64Images = (await Promise.all(result.figurePaths.map(loadBase64Data))).filter(
            (base64) => base64 !== null
          ) as string[]
          handleBase64Update(conversation.id, message.id, base64Images)
        }

        handleExecutionResult(message.id, result, isLastMessage, message.systemPrompt)
      } catch (error) {
        const result: ExecutionResult = { code }
        handleExecutionResult(message.id, result, isLastMessage, message.systemPrompt)
      }
    }

    const handleCopy = () => {
      navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
    }

    useEffect(() => {
      if (language !== 'python') return

      const handleKeyPress = (event: KeyboardEvent) => {
        if (isLastMessage && event.ctrlKey && event.key.toLowerCase() === 'r') {
          handleRun()
        }
      }

      document.addEventListener('keydown', handleKeyPress)

      return () => {
        document.removeEventListener('keydown', handleKeyPress)
      }
    }, [language, isLastMessage, handleRun])

    if (inline) {
      return (
        <code key={messageIndex} className="bg-gray-300 rounded px-1 py-0.5 text-sm">
          {code}
        </code>
      )
    }

    return (
      <div>
        {language === 'python' ? (
          <div className="flex justify-between items-center mb-2 mt-6">
            <span className="text-sm font-bold">Python</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center px-2 py-1 hover:bg-gray-400 bg-gray-500 text-white text-xs rounded transition-colors duration-200`}
                title="Copy code"
              >
                {isCopied ? (
                  <Check size={16} className="mr-1" />
                ) : (
                  <Copy size={16} className="mr-1" />
                )}
                <span>Copy</span>
              </button>
              <button
                onClick={handleRun}
                className={`flex items-center px-2 py-1 hover:bg-gray-400 bg-gray-500 text-white text-xs rounded transition-colors duration-200`}
              >
                <Play size={16} className="mr-1" />
                <span>Run</span>
              </button>
              {isLastMessage && (
                <p className="text-xs text-gray-500 ml-2">
                  Or press <span className="font-bold">CTRL + R</span>.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-2 mt-6">
            <span className="text-sm font-bold">{language}</span>
            <button
              onClick={handleCopy}
              className={`flex items-center px-2 py-1 hover:bg-gray-400 bg-gray-500 text-white text-xs rounded transition-colors duration-200`}
              title="Copy code"
            >
              {isCopied ? (
                <Check size={16} className="mr-1" />
              ) : (
                <Copy size={16} className="mr-1" />
              )}
              <span>Copied</span>
            </button>
          </div>
        )}
        <SyntaxHighlighter PreTag="div" style={oneLight} language={language}>
          {code}
        </SyntaxHighlighter>
        {language === 'python' && executionResult?.output && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div className="mb-2">
              <strong>Execution Result</strong>
            </div>
            <SyntaxHighlighter PreTag="div" style={oneLight} language="text">
              {executionResult.output}
            </SyntaxHighlighter>
          </div>
        )}
        {language === 'python' && base64Images.length > 0 && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div>
              <strong>Figures</strong>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {base64Images.map((base64, i) => (
                <ImageDisplay key={i} messageIndex={i} base64={base64} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

CodeBlock.displayName = 'CodeBlock'

export default CodeBlock
