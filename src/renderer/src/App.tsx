import { useCallback, useState, useEffect, useRef } from 'react'
import { streamText, generateText } from 'ai'
import { Message, Conversation } from '@shared/types/chat'
import { saveConversation } from './lib/ipcFunctions'
import { createOpenAI } from '@ai-sdk/openai'
import { InputSchema } from './lib/chat/inputSchema'
import ConversationsHistory from './components/ConversationsHistory'
import SidebarNavigation from './components/SidebarNavitation'
import Settings from './components/Settings'
import { updateConversation, ExecutionResult } from '@shared/types/chat'
import { loadConversation, createNewConversation, listConversations } from './lib/ipcFunctions'
import ChatInterface from './components/ChatInterface'
import { prompts, replacePlaceholders } from './lib/config/prompts'
import { getSettingsFromFile } from './lib/ipcFunctions'
import { Tab } from './components/SidebarNavitation'
import FileArea from './components/FileArea'
import { OpenAIModel } from '@shared/types/chat'
import { SystemPrompt } from './lib/config/prompts'

const App = (): JSX.Element => {
  const [input, setInput] = useState<string>('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversationFiles, setConversationFiles] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [openaiApiKey, setOpenaiApiKey] = useState<string | null>(null)
  const [openaiModel, setOpenaiModel] = useState<OpenAIModel>(OpenAIModel.GPT_4o_mini)
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab | null>(Tab.Conversations)
  const [systemPrompt, setSystemPrompt] = useState<SystemPrompt>(SystemPrompt.Default)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchOpenaiApiKey()
    loadConversations()
  }, [])

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
    }
  }, [currentConversation?.messages])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [currentConversation])

  const fetchOpenaiApiKey = async () => {
    try {
      const settings = await getSettingsFromFile()
      if (settings && settings.openai_key) {
        setOpenaiApiKey(settings.openai_key)
      }
    } catch (error) {
      console.error('Error fetching OpenAI API key:', error)
    }
  }

  const loadConversations = useCallback(async () => {
    try {
      const result = await listConversations()
      if (result.success && result.conversations) {
        setConversations(result.conversations)
      } else {
        console.error('Failed to load conversations:', result.error)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [])

  const handleNewConversation = async () => {
    setCurrentConversation(null)
    setSelectedFiles([])
    setConversationFiles([])
    setInput('')

    textareaRef.current?.focus()
  }

  const handleLoadConversation = async (id: string) => {
    try {
      const result = await loadConversation(id)
      if (result.success && result.conversation) {
        const conversation = result.conversation
        setCurrentConversation(conversation)
        if (conversation.filePaths) {
          setConversationFiles(conversation.filePaths)
        }
      } else {
        console.error('Failed to load conversation:', result.error)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const createOrUpdateConversation = async (userMessage: Message): Promise<Conversation> => {
    if (!openaiApiKey) {
      throw new Error('OpenAI API Key not set')
    }

    if (!currentConversation) {
      const titleGenerationPrompt = replacePlaceholders(prompts.titleGeneration, {
        input: userMessage.content
      })
      const generatedTitle = await generateText({
        model: createOpenAI({ apiKey: openaiApiKey })('gpt-4o-mini'),
        prompt: titleGenerationPrompt
      })

      const formattedTitle = generatedTitle.text.replace(/^["']|["']$/g, '').trim()
      const result = await createNewConversation(formattedTitle)

      if (!result.success || !result.conversation) {
        throw new Error('Failed to create new conversation')
      }
      const updatedConversation = updateConversation(
        result.conversation,
        userMessage,
        selectedFiles
      )
      setSelectedFiles([])

      return updatedConversation
    } else {
      const updatedConversation = updateConversation(
        { ...currentConversation },
        userMessage,
        selectedFiles
      )
      setSelectedFiles([])

      return updatedConversation
    }
  }

  const createMessagesForLLM = (conversation: Conversation): Message[] => {
    return conversation.messages.map((message) => {
      if (message.role === 'user') {
        if (message.filePaths && message.filePaths.length > 0) {
          return {
            ...message,
            content: `${message.content}\n\nFiles attached\n${message.filePaths.join('\n')}`
          }
        }
        return message
      } else if (message.role === 'assistant' && message.executionResult) {
        const result = message.executionResult
        let resultText = '\n\nExecution Result:'

        if (result.output) resultText += `\nOutput:\n${result.output}`
        if (result.figurePaths && result.figurePaths.length > 0) {
          resultText += `\nFigures:\n${result.figurePaths.join('\n')}`
        }

        return {
          ...message,
          content: `${message.content}${resultText}`
        }
      }
      return message
    })
  }

  const streamAIResponse = async (conversation: Conversation): Promise<Message> => {
    if (!openaiApiKey) {
      throw new Error('OpenAI API Key not set')
    }

    const openai = createOpenAI({ apiKey: openaiApiKey })
    const result = await streamText({
      model: openai(openaiModel),
      system: prompts.system[systemPrompt],
      messages: createMessagesForLLM(conversation)
    })

    let fullResponse = ''
    const aiMessageId = conversation.messages.length + 1
    const newAIMessage: Message = { id: aiMessageId, role: 'assistant', content: '' }

    for await (const delta of result.textStream) {
      fullResponse += delta
      setCurrentConversation((prev) => {
        if (prev) {
          const updatedMessages = [...prev.messages]
          if (updatedMessages[updatedMessages.length - 1].role === 'assistant') {
            updatedMessages[updatedMessages.length - 1].content = fullResponse
          } else {
            updatedMessages.push({ ...newAIMessage, content: fullResponse })
          }
          return { ...prev, messages: updatedMessages, updatedAt: new Date() }
        }
        return prev
      })
    }

    return { ...newAIMessage, content: fullResponse }
  }

  const updateConversationsState = (updatedConversation: Conversation) => {
    setConversations((prevConversations) => {
      const existingIndex = prevConversations.findIndex((c) => c.id === updatedConversation.id)
      if (existingIndex !== -1) {
        return [
          updatedConversation,
          ...prevConversations.slice(0, existingIndex),
          ...prevConversations.slice(existingIndex + 1)
        ]
      } else {
        return [updatedConversation, ...prevConversations]
      }
    })
  }

  const handleSendMessage = useCallback(async () => {
    const userMessage = input.trim()
    if (!userMessage || !openaiApiKey) return

    try {
      const parsedUserMessage = InputSchema.parse({ input: userMessage })
      const userMessageId = (currentConversation?.messages.length || 0) + 1
      const userInput = parsedUserMessage.input

      const newUserMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: userInput,
        filePaths: selectedFiles
      }

      let updatedConversation = await createOrUpdateConversation({
        ...newUserMessage,
        content: userInput
      })

      setCurrentConversation(updatedConversation)
      setInput('')
      setIsStreaming(true)

      const aiMessage = await streamAIResponse(updatedConversation)
      setIsStreaming(false)

      updatedConversation = updateConversation(updatedConversation, aiMessage)
      await saveConversation(updatedConversation)

      updateConversationsState(updatedConversation)
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Error processing input:', error)
      setIsStreaming(false)
      textareaRef.current?.focus()
    }
  }, [input, openaiApiKey, currentConversation])

  const handleExecutionResult = useCallback(
    (messageId: number, executionResult: ExecutionResult) => {
      setCurrentConversation((prevConversation) => {
        if (!prevConversation) return null
        const updatedMessages = prevConversation.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                executionResult: executionResult
              }
            : message
        )
        const updatedConversation = { ...prevConversation, messages: updatedMessages }
        saveConversation(updatedConversation)
        return updatedConversation
      })
    },
    []
  )

  const handleFileSelect = useCallback((filePaths: string[]) => {
    if (filePaths.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...filePaths])
      setConversationFiles((prevFiles) => [...prevFiles, ...filePaths])
      setActiveTab(Tab.Files)
    }
  }, [])

  const handleTabChange = (tab: Tab) => {
    setActiveTab((prevTab) => (prevTab === tab ? null : tab))
  }

  const handleApiKeyChange = useCallback(
    (newApiKey: string) => {
      setOpenaiApiKey(newApiKey)
      console.log('New API Key saved:', newApiKey)
    },
    [setOpenaiApiKey]
  )

  const handleModelChange = useCallback(
    (newModel: OpenAIModel) => {
      setOpenaiModel(newModel)
      console.log('New model selected:', newModel)
    },
    [setOpenaiModel]
  )

  const handleSystemPromptChange = useCallback(
    (newPrompt: SystemPrompt) => {
      setSystemPrompt(newPrompt)
      console.log('New system prompt selected:', newPrompt)
    },
    [setSystemPrompt]
  )

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
    } else if (activeTab == Tab.Files) {
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
        onSystemPromptChange={handleSystempromptChange}
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
