import React from 'react'

interface SettingsProps {
  apiKey: string | null
}

const Settings: React.FC<SettingsProps> = ({ apiKey }) => {
  const displayApiKey = apiKey ? `********${apiKey.slice(-4)}` : 'Not set'

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="w-full max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          {displayApiKey}
        </div>
      </div>
    </div>
  )
}

export default Settings
