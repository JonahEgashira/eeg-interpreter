import React from 'react'

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-96 text-center space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-3xl font-bold text-gray-800">EEG Interpreter</div>

        <div className="text-lg text-gray-600">Setting up Python environment...</div>

        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
        </div>

        <div className="text-sm text-gray-500 text-left space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Initializing application</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Setting up Python environment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span>Starting Jupyter server</span>
          </div>
        </div>
      </div>
    </div>
  )
}
