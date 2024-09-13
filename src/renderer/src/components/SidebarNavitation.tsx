import React from 'react'
import { MessageCircle, Settings, File } from 'lucide-react'

interface SidebarNavigationProps {
  activeTab: string | null
  onTabChange: (tab: string) => void
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col items-center w-16 bg-black text-white h-screen">
      <button
        className={`relative p-4 hover:bg-gray-800 ${
          activeTab === 'conversations' ? 'bg-black' : ''
        }`}
        onClick={() => onTabChange('conversations')}
        title="Conversations"
      >
        {activeTab === 'conversations' && (
          <span className="absolute left-0 top-0 h-full w-1 bg-white"></span>
        )}
        <MessageCircle size={32} />
      </button>
      <button
        className={`relative p-4 hover:bg-gray-800 ${activeTab === 'files' ? 'bg-black' : ''}`}
        onClick={() => onTabChange('files')}
        title="Files"
      >
        {activeTab === 'files' && (
          <span className="absolute left-0 top-0 h-full w-1 bg-white"></span>
        )}
        <File size={32} />
      </button>

      <div className="mt-auto">
        <button
          className={`relative p-4 hover:bg-gray-800 ${activeTab === 'settings' ? 'bg-black' : ''}`}
          onClick={() => onTabChange('settings')}
          title="Settings"
        >
          {activeTab === 'settings' && (
            <span className="absolute left-0 top-0 h-full w-1 bg-white"></span>
          )}
          <Settings size={32} />
        </button>
      </div>
    </div>
  )
}

export default SidebarNavigation
