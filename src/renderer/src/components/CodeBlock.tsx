import React, { useMemo, memo, useEffect } from 'react'
import { runPythonCode } from '@renderer/lib/ipcFunctions'
import { Download, Play } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Conversation } from '@shared/types/chat'
import { ExecutionResult } from '@shared/types/chat'
import {
  saveConversationWithPythonResult,
  getConversationImagesDir,
  loadBase64Data
} from '@renderer/lib/ipcFunctions'

interface CodeBlockProps {
  conversation: Conversation
  messageId: number
  code: string
  handleExecutionResult: (
    messageId: number,
    result: ExecutionResult,
    isLastMessage: boolean
  ) => void
  language: string
  inline: boolean
  messageIndex: number
  base64Images: string[]
  handleBase64Update: (conversationId: string, messageId: number, base64: string[]) => void
  isLastMessage: boolean
}

const ImageDisplay = memo(({ messageIndex, base64 }: { messageIndex: number; base64: string }) => (
  <div className="flex flex-col items-start mb-2">
    <a
      href={`data:image/png;base64,${base64}`}
      download={`${Date.now()}-${messageIndex}.png`}
      className="my-2 self-end p-1 text-black underline flex items-center"
    >
      <Download size={20} />
    </a>
    <img src={`data:image/png;base64,${base64}`} alt="figure" className="max-w-full" />
  </div>
))
ImageDisplay.displayName = 'ImageDisplay'

const CodeBlock: React.FC<CodeBlockProps> = memo(
  ({
    conversation,
    messageId,
    code,
    handleExecutionResult,
    language,
    inline,
    messageIndex,
    base64Images,
    handleBase64Update,
    isLastMessage
  }) => {
    const executionResult = useMemo(() => {
      return conversation?.messages.find(
        (message) => message.id === messageId && message.executionResult
      )?.executionResult
    }, [conversation, messageId])

    const handleRun = async () => {
      try {
        const figureDir = await getConversationImagesDir(conversation.id)
        const result = await runPythonCode(figureDir, code, conversation.id)
        await saveConversationWithPythonResult(conversation, messageId, result)

        if (result.figurePaths) {
          const base64Images = (await Promise.all(result.figurePaths.map(loadBase64Data))).filter(
            (base64) => base64 !== null
          ) as string[]
          handleBase64Update(conversation.id, messageId, base64Images)
        }
        handleExecutionResult(messageId, result, isLastMessage)
      } catch (error) {
        const result: ExecutionResult = { code }
        handleExecutionResult(messageId, result, isLastMessage)
      }
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
        {language === 'python' && (
          <div className="flex justify-between items-center mb-2 mt-6">
            <span className="text-sm font-bold">Python</span>
            <div className="flex items-center">
              <button
                onClick={handleRun}
                className="px-2 py-1 hover:bg-gray-400 bg-gray-500 text-white text-xs rounded"
              >
                <Play size={16} />
              </button>
              {isLastMessage && (
                <p className="text-xs text-gray-500 ml-2">
                  Or press <span className="font-bold">CTRL + R</span>.
                </p>
              )}
            </div>
          </div>
        )}
        <SyntaxHighlighter PreTag="div" style={oneLight} language={language}>
          {code}
        </SyntaxHighlighter>
        {language === 'python' && executionResult?.output && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div className="mb-2">
              <strong>Output</strong>
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
