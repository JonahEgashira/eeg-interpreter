import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomAPI {
  runPythonCode: (code: string) => Promise<string>
  getEnvVar: (key: string) => Promise<string | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
