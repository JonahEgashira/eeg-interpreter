import React, { useState, memo } from 'react'
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
  language: string
  inline: boolean
  index: number
}

const CodeBlock: React.FC<CodeBlockProps> = memo(
  ({ conversation, messageId, code, language, inline, index }) => {
    const [result, setResult] = useState<ExecutionResult | null>(null)
    const [base64Figures, setBase64Figures] = useState<string[]>([])

    const handleRun = async () => {
      try {
        const figureDir = await getConversationImagesDir(conversation.id)
        const result = await runPythonCode(figureDir, code)
        await saveConversationWithPythonResult(conversation, messageId, result)
        setResult(result)

        if (result.figurePaths) {
          const base64Images = (await Promise.all(result.figurePaths.map(loadBase64Data))).filter(
            (base64) => base64 !== null
          ) as string[]
          setBase64Figures(base64Images)
        }
      } catch (error) {
        const result: ExecutionResult = {
          code,
          error: (error as Error).message
        }
        setResult(result)
      }
    }

    if (inline) {
      return (
        <code key={index} className="bg-gray-200 rounded px-1 py-0.5 text-sm">
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
        {language === 'python' && result?.output && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div className="mb-2">
              <strong>Output</strong>
            </div>
            <div dangerouslySetInnerHTML={{ __html: result.output }} />
          </div>
        )}
        {language === 'python' && base64Figures.length > 0 && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div>
              <strong>Figures</strong>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {base64Figures.map((base64, i) => (
                <div key={i} className="flex flex-col items-start mb-2">
                  <a
                    href={`data:image/png;base64,${base64}`}
                    download={`figure-${i}-test.png`}
                    className="my-2 self-end p-1 text-black underline flex items-center"
                  >
                    <Download size={20} />
                  </a>
                  <img
                    src={`data:image/png;base64,${base64}`}
                    alt={`figure-${i}`}
                    className="max-w-full"
                  />
                </div>
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
