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
  const sortedConversations = conversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <div className="w-64 bg-gray-100 text-gray-800 p-4 flex flex-col border-r border-gray-300">
      <button
        onClick={onNewConversation}
        className="mb-4 flex items-center justify-center space-x-2 bg-white hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded border border-gray-300 transition-colors duration-200"
      >
        <Plus size={20} />
      </button>
      <div className="flex-grow overflow-auto">
        {sortedConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-2 mb-2 rounded cursor-pointer transition-colors duration-200 ${
              conversation.id === currentConversationId
                ? 'bg-gray-300 text-gray-900'
                : 'hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => onLoadConversation(conversation.id)}
          >
            {conversation.title || 'New Conversation'}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
