import React from 'react'
import { MessageSquare, Settings } from 'lucide-react'

interface SidebarNavigationProps {
  activeTab: string | null
  onTabChange: (tab: string) => void
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col items-center w-16 bg-black text-white">
      <button
        className={`p-4 hover:bg-gray-700 ${activeTab === 'conversations' ? 'bg-black' : ''}`}
        onClick={() => onTabChange('conversations')}
        title="Conversations"
      >
        <MessageSquare size={32} />
      </button>
      <button
        className={`p-4 hover:bg-gray-700 ${activeTab === 'settings' ? 'bg-black' : ''}`}
        onClick={() => onTabChange('settings')}
        title="Settings"
      >
        <Settings size={32} />
      </button>
    </div>
  )
}

export default SidebarNavigation
