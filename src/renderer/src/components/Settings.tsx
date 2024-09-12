import React, { useState, useEffect } from 'react'
import { getSettingsFromFile, saveSettingsToFile } from '@renderer/lib/ipcFunctions'

interface SettingsProps {
  onApiKeyChange: (newApiKey: string) => void
}

const Settings: React.FC<SettingsProps> = ({ onApiKeyChange }) => {
  const [newApiKey, setNewApiKey] = useState<string>('')
  const [maskedApiKey, setMaskedApiKey] = useState<string>('')
  const [isEditing, setIsEditing] = useState<boolean>(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettingsFromFile()
        if (settings && settings.openai_key) {
          const fullApiKey = settings.openai_key
          setNewApiKey(fullApiKey)
          const maskedKey = `********${fullApiKey.slice(-4)}`
          setMaskedApiKey(maskedKey)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleSaveApiKey = async () => {
    try {
      await saveSettingsToFile({ openai_key: newApiKey })
      onApiKeyChange(newApiKey)
      const maskedKey = `********${newApiKey.slice(-4)}`
      setMaskedApiKey(maskedKey)
      setIsEditing(false)
      alert('API key saved successfully!')
    } catch (error) {
      console.error('Error saving OpenAI API key:', error)
      alert('Failed to save API key')
    }
  }

  const handleChangeApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewApiKey(e.target.value)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-4xl w-full h-full flex flex-col">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">OpenAI API Key Settings</h2>
              {maskedApiKey ? (
                <p className="mb-6">Your current API key:</p>
              ) : (
                <p className="mb-6">Please enter your OpenAI API Key to start using the app.</p>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={isEditing ? newApiKey : maskedApiKey}
                  onChange={handleChangeApiKey}
                  className="block w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your OpenAI API Key"
                  readOnly={!isEditing}
                />
                {maskedApiKey && !isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="absolute right-2 top-2 text-blue-500 hover:text-blue-600"
                  >
                    Edit
                  </button>
                )}
              </div>
              <button
                onClick={handleSaveApiKey}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-300"
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto w-full text-center text-sm text-gray-400">
          Your API key is securely stored locally.
        </div>
      </div>
    </div>
  )
}

export default Settings
