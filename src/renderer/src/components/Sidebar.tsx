import { Conversation } from '@shared/types/chat'
import { Plus } from 'lucide-react'

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | undefined
  onNewConversation: () => void
  onLoadConversation: (id: string) => void
}

const Sidebar = ({
  conversations,
  currentConversationId,
  onNewConversation,
  onLoadConversation
}: SidebarProps): JSX.Element => {
  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <button
        onClick={onNewConversation}
        className="mb-4 flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        <Plus size={20} />
        <span>New Conversation</span>
      </button>
      <div className="flex-grow overflow-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-2 mb-2 rounded cursor-pointer ${
              conversation.id === currentConversationId ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
            onClick={() => onLoadConversation(conversation.id)}
          >
            {conversation.title}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
