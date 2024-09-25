import React, { useState, useEffect } from 'react'
import { getSettingsFromFile, saveSettingsToFile } from '@renderer/lib/ipcFunctions'

interface SettingsProps {
  onOpenAIApiKeyChange: (newApiKey: string) => void
  onGoogleApiKeyChange: (newApiKey: string) => void
  onAnthropicApiKeyChange: (newApiKey: string) => void
}

const Settings: React.FC<SettingsProps> = ({
  onOpenAIApiKeyChange,
  onGoogleApiKeyChange,
  onAnthropicApiKeyChange
}) => {
  const [openaiKey, setOpenaiKey] = useState<string>('')
  const [maskedOpenaiKey, setMaskedOpenaiKey] = useState<string>('')
  const [googleKey, setGoogleKey] = useState<string>('')
  const [maskedGoogleKey, setMaskedGoogleKey] = useState<string>('')
  const [anthropicKey, setAnthropicKey] = useState<string>('')
  const [maskedAnthropicKey, setMaskedAnthropicKey] = useState<string>('')

  const [isEditingOpenAI, setIsEditingOpenAI] = useState<boolean>(false)
  const [isEditingGoogle, setIsEditingGoogle] = useState<boolean>(false)
  const [isEditingAnthropic, setIsEditingAnthropic] = useState<boolean>(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettingsFromFile()
        if (settings) {
          if (settings.openai_key) {
            setOpenaiKey(settings.openai_key)
            setMaskedOpenaiKey(`********${settings.openai_key.slice(-4)}`)
          } else {
            setIsEditingOpenAI(true)
          }
          if (settings.google_key) {
            setGoogleKey(settings.google_key)
            setMaskedGoogleKey(`********${settings.google_key.slice(-4)}`)
          } else {
            setIsEditingGoogle(true)
          }
          if (settings.anthropic_key) {
            setAnthropicKey(settings.anthropic_key)
            setMaskedAnthropicKey(`********${settings.anthropic_key.slice(-4)}`)
          } else {
            setIsEditingAnthropic(true)
          }
        } else {
          setIsEditingOpenAI(true)
          setIsEditingGoogle(true)
          setIsEditingAnthropic(true)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        setIsEditingOpenAI(true)
        setIsEditingGoogle(true)
        setIsEditingAnthropic(true)
      }
    }
    loadSettings()
  }, [])

  const handleSaveOpenAIKey = async () => {
    try {
      await saveSettingsToFile({ ...(await getSettingsFromFile()), openai_key: openaiKey })
      onOpenAIApiKeyChange(openaiKey)
      setMaskedOpenaiKey(`********${openaiKey.slice(-4)}`)
      setIsEditingOpenAI(false)
    } catch (error) {
      console.error('Error saving OpenAI API key:', error)
    }
  }

  const handleSaveGoogleKey = async () => {
    try {
      await saveSettingsToFile({ ...(await getSettingsFromFile()), google_key: googleKey })
      onGoogleApiKeyChange(googleKey)
      setMaskedGoogleKey(`********${googleKey.slice(-4)}`)
      setIsEditingGoogle(false)
    } catch (error) {
      console.error('Error saving Google API key:', error)
    }
  }

  const handleSaveAnthropicKey = async () => {
    try {
      await saveSettingsToFile({ ...(await getSettingsFromFile()), anthropic_key: anthropicKey })
      onAnthropicApiKeyChange(anthropicKey)
      setMaskedAnthropicKey(`********${anthropicKey.slice(-4)}`)
      setIsEditingAnthropic(false)
    } catch (error) {
      console.error('Error saving Anthropic API key:', error)
    }
  }

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-4xl w-full h-full flex flex-col">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">OpenAI API Key</h2>
              {maskedOpenaiKey ? (
                <p className="mb-6">Your current API key ends in {maskedOpenaiKey.slice(-4)}</p>
              ) : (
                <p className="mb-6">Please enter your OpenAI API Key.</p>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={isEditingOpenAI ? openaiKey : maskedOpenaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="block w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your OpenAI API Key"
                  readOnly={!isEditingOpenAI && !!maskedOpenaiKey}
                />
                {maskedOpenaiKey && !isEditingOpenAI && (
                  <button
                    onClick={() => setIsEditingOpenAI(true)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-600"
                  >
                    Edit
                  </button>
                )}
              </div>
              <button
                onClick={handleSaveOpenAIKey}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300 mb-8"
              >
                Save OpenAI API Key
              </button>

              <h2 className="text-2xl font-bold mb-4 mt-8">Google API Key</h2>
              <div className="relative">
                <input
                  type="text"
                  value={isEditingGoogle ? googleKey : maskedGoogleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  className="block w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Google API Key"
                  readOnly={!isEditingGoogle && !!maskedGoogleKey}
                />
                {maskedGoogleKey && !isEditingGoogle && (
                  <button
                    onClick={() => setIsEditingGoogle(true)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-600"
                  >
                    Edit
                  </button>
                )}
              </div>
              <button
                onClick={handleSaveGoogleKey}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300 mb-8"
              >
                Save Google API Key
              </button>

              <h2 className="text-2xl font-bold mb-4 mt-8">Anthropic API Key</h2>
              <div className="relative">
                <input
                  type="text"
                  value={isEditingAnthropic ? anthropicKey : maskedAnthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="block w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Anthropic API Key"
                  readOnly={!isEditingAnthropic && !!maskedAnthropicKey}
                />
                {maskedAnthropicKey && !isEditingAnthropic && (
                  <button
                    onClick={() => setIsEditingAnthropic(true)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-600"
                  >
                    Edit
                  </button>
                )}
              </div>
              <button
                onClick={handleSaveAnthropicKey}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
              >
                Save Anthropic API Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
