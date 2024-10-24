import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

const LoadingScreen = () => {
  const [steps, setSteps] = useState([
    { id: 'python', label: 'Setting up Python Environment', status: 'loading' },
    { id: 'packages', label: 'Installing Required Packages', status: 'waiting' },
    { id: 'jupyter', label: 'Starting Jupyter Server', status: 'waiting' }
  ])

  useEffect(() => {
    const simulateProgress = () => {
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((step) => (step.id === 'python' ? { ...step, status: 'completed' } : step))
        )

        setTimeout(() => {
          setSteps((prev) =>
            prev.map((step) => (step.id === 'packages' ? { ...step, status: 'loading' } : step))
          )

          setTimeout(() => {
            setSteps((prev) =>
              prev.map((step) =>
                step.id === 'packages'
                  ? { ...step, status: 'completed' }
                  : step.id === 'jupyter'
                    ? { ...step, status: 'loading' }
                    : step
              )
            )
          }, 2000)
        }, 1000)
      }, 3000)
    }

    simulateProgress()
  }, [])

  const getStatusStyles = (status) => {
    switch (status) {
      case 'loading':
        return 'text-blue-600 font-medium'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 transform transition-all duration-500 ease-in-out hover:shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Initializing Application
        </h1>
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center space-x-4 transform transition-all duration-300 ease-in-out ${
                step.status === 'loading' ? 'scale-105' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {step.status === 'loading' && (
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin [animation-duration:1s]" />
                )}
                {step.status === 'completed' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                {step.status === 'waiting' && (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-200" />
                )}
                {step.status === 'error' && <AlertCircle className="h-6 w-6 text-red-500" />}
              </div>
              <span
                className={`flex-1 transition-colors duration-300 ${getStatusStyles(step.status)}`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center text-sm text-gray-500">
          This may take a few minutes on first launch
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
