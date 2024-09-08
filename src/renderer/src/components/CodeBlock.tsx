import React, { useState, memo } from 'react'
import { runPythonCode } from '@renderer/lib/ipcFunctions'
import { Play, Download } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  conversationId: string
  code: string
  language: string
  inline: boolean
  index: number
}

const CodeBlock: React.FC<CodeBlockProps> = memo(
  ({ conversationId, code, language, inline, index }) => {
    const [result, setResult] = useState<string | null>(null)

    const handleRun = async () => {
      try {
        const res = await runPythonCode(conversationId, code)
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
        {language === 'python' && result && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div className="mb-2 flex justify-between items-center">
              <strong>Output</strong>
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
)

CodeBlock.displayName = 'CodeBlock'

export default CodeBlock
