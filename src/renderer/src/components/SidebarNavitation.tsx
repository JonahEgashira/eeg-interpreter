import React from 'react'
import { MessageCircle, Settings, File } from 'lucide-react'

export enum Tab {
  Conversations = 'conversations',
  Files = 'files',
  Settings = 'settings'
}

interface SidebarNavigationProps {
  activeTab: Tab | null
  onTabChange: (tab: Tab) => void
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col items-center w-16 bg-black text-white h-screen">
      <button
        className={`relative p-4 hover:bg-gray-800 ${
          activeTab === Tab.Conversations ? 'bg-black' : ''
        }`}
        onClick={() => onTabChange(Tab.Conversations)}
        title="Conversations"
      >
        {activeTab === Tab.Conversations && (
          <span className="absolute left-0 top-0 h-full w-1 bg-white"></span>
        )}
        <MessageCircle size={32} />
      </button>
      <button
        className={`relative p-4 hover:bg-gray-800 ${activeTab === Tab.Files ? 'bg-black' : ''}`}
        onClick={() => onTabChange(Tab.Files)}
        title="Files"
      >
        {activeTab === Tab.Files && (
          <span className="absolute left-0 top-0 h-full w-1 bg-white"></span>
        )}
        <File size={32} />
      </button>

      <div className="mt-auto">
        <button
          className={`relative p-4 hover:bg-gray-800 ${activeTab === Tab.Settings ? 'bg-black' : ''}`}
          onClick={() => onTabChange(Tab.Settings)}
          title="Settings"
        >
          {activeTab === Tab.Settings && (
            <span className="absolute left-0 top-0 h-full w-1 bg-white"></span>
          )}
          <Settings size={32} />
        </button>
      </div>
    </div>
  )
}

export default SidebarNavigation
