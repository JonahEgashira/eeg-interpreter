import ConversationsHistory from './components/ConversationsHistory'
import SidebarNavigation from './components/SidebarNavitation'
import Settings from './components/Settings'
import ChatInterface from './components/ChatInterface'
import FileArea from './components/FileArea'
import { Tab } from './components/SidebarNavitation'
import { useChat } from './lib/chat/useChat'

const App = (): JSX.Element => {
  const {
    input,
    setInput,
    conversations,
    currentConversation,
    conversationFiles,
    selectedFiles,
    openaiApiKey,
    isStreaming,
    activeTab,
    textareaRef,
    handleNewConversation,
    handleLoadConversation,
    handleSendMessage,
    handleExecutionResult,
    handleFileSelect,
    handleTabChange,
    handleApiKeyChange,
    handleModelChange,
    handleSystemPromptChange
  } = useChat()

  const renderContent = () => {
    if (activeTab === Tab.Settings || !openaiApiKey) {
      return <Settings onApiKeyChange={handleApiKeyChange} />
    } else if (activeTab === Tab.Conversations) {
      return (
        <>
          <ConversationsHistory
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            onNewConversation={handleNewConversation}
            onLoadConversation={handleLoadConversation}
          />
          <ChatInterface
            currentConversation={currentConversation}
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            handleExecutionResult={handleExecutionResult}
            handleFileSelect={handleFileSelect}
            selectedFiles={selectedFiles}
            textAreaRef={textareaRef}
            isStreaming={isStreaming}
            openaiApiKey={openaiApiKey}
            onModelChange={handleModelChange}
            onSystemPromptChange={handleSystemPromptChange}
          />
        </>
      )
    } else if (activeTab === Tab.Files) {
      return (
        <>
          <FileArea filePaths={conversationFiles} />
          <ChatInterface
            currentConversation={currentConversation}
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            handleExecutionResult={handleExecutionResult}
            handleFileSelect={handleFileSelect}
            selectedFiles={selectedFiles}
            textAreaRef={textareaRef}
            isStreaming={isStreaming}
            openaiApiKey={openaiApiKey}
            onModelChange={handleModelChange}
            onSystemPromptChange={handleSystemPromptChange}
          />
        </>
      )
    }
    return (
      <ChatInterface
        currentConversation={currentConversation}
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        handleExecutionResult={handleExecutionResult}
        handleFileSelect={handleFileSelect}
        selectedFiles={selectedFiles}
        textAreaRef={textareaRef}
        isStreaming={isStreaming}
        openaiApiKey={openaiApiKey}
        onModelChange={handleModelChange}
        onSystemPromptChange={handleSystemPromptChange}
      />
    )
  }

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <SidebarNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      {renderContent()}
    </div>
  )
}

export default App
