import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const LoadingScreen = () => {
  const [error, setError] = useState(null)

  useEffect(() => {
    window.electron?.ipcRenderer?.on('setup-error', (_, error) => {
      setError(error.message)
    })

    return () => {
      window.electron?.ipcRenderer?.removeAllListeners('setup-error')
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-3xl text-gray-900">Starting Application</h1>

        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>

        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <p className="text-gray-500 text-sm">
            This may take a few minutes on first launch to install Python
          </p>
        )}
      </div>
    </div>
  )
}

export default LoadingScreen
