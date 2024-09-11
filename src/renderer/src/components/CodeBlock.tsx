import React, { useMemo, memo } from 'react'
import { runPythonCode } from '@renderer/lib/ipcFunctions'
import { Play, Download } from 'lucide-react'
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
  handleExecutionResult: (messageId: number, result: ExecutionResult) => void
  language: string
  inline: boolean
  index: number
  base64Images: string[]
  handleBase64Update: (conversationId: string, messageId: number, base64: string[]) => void
}

const ImageDisplay = memo(({ index, base64 }: { index: number; base64: string }) => (
  <div className="flex flex-col items-start mb-2">
    <a
      href={`data:image/png;base64,${base64}`}
      download={`${Date.now()}-${index}.png`}
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
    index,
    base64Images,
    handleBase64Update
  }) => {
    const executionResult = useMemo(() => {
      return conversation?.messages.find(
        (message) => message.id === messageId && message.executionResults
      )?.executionResults?.[0]
    }, [conversation, messageId])

    const handleRun = async () => {
      try {
        const figureDir = await getConversationImagesDir(conversation.id)
        const result = await runPythonCode(figureDir, code)
        await saveConversationWithPythonResult(conversation, messageId, result)

        if (result.figurePaths) {
          const base64Images = (await Promise.all(result.figurePaths.map(loadBase64Data))).filter(
            (base64) => base64 !== null
          ) as string[]
          handleBase64Update(conversation.id, messageId, base64Images)
        }
        handleExecutionResult(messageId, result)
      } catch (error) {
        const result: ExecutionResult = {
          code,
          error: (error as Error).message
        }
        handleExecutionResult(messageId, result)
      }
    }

    if (inline) {
      return (
        <code key={index} className="bg-gray-300 rounded px-1 py-0.5 text-sm">
          {code}
        </code>
      )
    }

    return (
      <div>
        {language === 'python' && (
          <div className="flex justify-between items-center mb-2 mt-6">
            <span className="text-sm font-bold">Python</span>
            <button
              onClick={handleRun}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
            >
              <Play size={18} />
            </button>
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
            <div dangerouslySetInnerHTML={{ __html: executionResult.output }} />
          </div>
        )}
        {language === 'python' && base64Images.length > 0 && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div>
              <strong>Figures</strong>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {base64Images.map((base64, i) => (
                <ImageDisplay key={i} index={i} base64={base64} />
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
