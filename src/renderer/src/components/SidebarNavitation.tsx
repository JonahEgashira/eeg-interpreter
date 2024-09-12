import React from 'react'
import { MessageSquare, Settings } from 'lucide-react'

interface SidebarNavigationProps {
  activeTab: string | null
  onTabChange: (tab: string) => void
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col items-center w-16 bg-gray-800 text-white">
      <button
        className={`p-4 hover:bg-gray-700 ${activeTab === 'conversations' ? 'bg-gray-600' : ''}`}
        onClick={() => onTabChange('conversations')}
        title="Conversations"
      >
        <MessageSquare size={32} />
      </button>
      <button
        className={`p-4 hover:bg-gray-700 ${activeTab === 'settings' ? 'bg-gray-600' : ''}`}
        onClick={() => onTabChange('settings')}
        title="Settings"
      >
        <Settings size={32} />
      </button>
    </div>
  )
}

export default SidebarNavigation
