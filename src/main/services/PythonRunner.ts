import { spawn, ChildProcess } from 'child_process'
import { KernelManager, ServerConnection } from '@jupyterlab/services'

let jupyterProcess: ChildProcess | null = null

export const JUPYTER_TOKEN = 'my-jupyter'

export function startJupyterServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    jupyterProcess = spawn('jupyter', [
      'notebook',
      '--no-browser',
      '--port=8888',
      `--NotebookApp.token=${JUPYTER_TOKEN}`,
      '--NotebookApp.disable_check_xsrf=True'
    ])
    if (!jupyterProcess) {
      reject(new Error('Failed to start Jupyter server'))
      return
    }
    if (jupyterProcess.stdout) {
      jupyterProcess.stdout.on('data', (data) => {
        console.log(`Jupyter stdout: ${data}`)
        if (data.toString().includes('http://localhost:8888/')) {
          resolve()
        }
      })
    }
    if (jupyterProcess.stderr) {
      jupyterProcess.stderr.on('data', (data) => {
        console.error(`Jupyter stderr: ${data}`)
      })
    }
    jupyterProcess.on('close', (code) => {
      console.log(`Jupyter server exited with code ${code}`)
      jupyterProcess = null
    })
    jupyterProcess.on('error', (err) => {
      console.error('Failed to start Jupyter server:', err)
      reject(err)
    })
  })
}

export function stopJupyterServer(): void {
  if (jupyterProcess) {
    jupyterProcess.kill()
    jupyterProcess = null
    console.log('Jupyter server stopped')
  }
}

export async function runPythonCode(code: string): Promise<string> {
  const settings = ServerConnection.makeSettings({
    baseUrl: 'http://localhost:8888',
    token: JUPYTER_TOKEN
  })

  try {
    const kernelManager = new KernelManager({ serverSettings: settings })
    const kernel = await kernelManager.startNew({ name: 'python3' })
    const future = kernel.requestExecute({ code })

    return new Promise((resolve, reject) => {
      let result = ''
      future.onIOPub = (msg): void => {
        if (msg.header.msg_type === 'execute_result' || msg.header.msg_type === 'stream') {
          result += (msg.content as { text: string }).text
        } else if (msg.header.msg_type === 'error') {
          const errorMsg = (msg.content as { evalue: string }).evalue
          reject(new Error(errorMsg))
        }
      }
      future.done.then(() => {
        kernel
          .shutdown()
          .then(() => resolve(result))
          .catch(reject)
      })
    })
  } catch (error) {
    console.error('Error in runPythonCode:', error)
    throw error
  }
}
