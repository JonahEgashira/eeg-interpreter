import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): JSX.Element {
  const [output, setOutput] = useState<string>('')

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const handleExecutePythonCode = async (): Promise<void> => {
    const pythonCode = `
import sys

def main():
    print("Hello from embedded Python code!")

if __name__ == "__main__":
    main()
`
    try {
      // 'run-python-code' チャンネルを使ってPythonコードを実行する
      const result = await window.electron.ipcRenderer.invoke('run-python-code', pythonCode)
      setOutput(result)
    } catch (error) {
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`)
      } else {
        setOutput('An unknown error occurred')
      }
    }
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={handleExecutePythonCode}>
            Execute Python Code
          </a>
        </div>
      </div>
      <pre>{output}</pre>
      <Versions></Versions>
    </>
  )
}

export default App
