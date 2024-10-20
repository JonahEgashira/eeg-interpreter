import { useState, useEffect, useCallback, useRef } from 'react'
import { streamText, generateText, generateObject } from 'ai'
import { Message, Conversation, ExecutionResult, LLMModel } from '@shared/types/chat'
import {
  saveConversation,
  loadConversation,
  createNewConversation,
  listConversations,
  getSettingsFromFile
} from './lib/ipcFunctions'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'
import { InputSchema } from './lib/chat/inputSchema'
import { prompts, SystemPrompt, replacePlaceholders } from './lib/config/prompts'
import { Tab } from './components/SidebarNavitation'
import { updateConversation } from '@shared/types/chat'
import ConversationsHistory from './components/ConversationsHistory'
import SidebarNavigation from './components/SidebarNavitation'
import Settings from './components/Settings'
import ChatInterface from './components/ChatInterface'
import FileArea from './components/FileArea'
import { promptSchema } from './lib/config/prompts'

const App = (): JSX.Element => {
  const [input, setInput] = useState<string>('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversationFiles, setConversationFiles] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [autoAssistantEnabled, setAutoAssistantEnabled] = useState<boolean>(true)
  const [openaiApiKey, setOpenaiApiKey] = useState<string | null>(null)
  const [llmModel, setLlmModel] = useState<LLMModel>(LLMModel.GPT_4o)
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null)
  const [anthropicApiKey, setAnthropicApiKey] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab | null>(Tab.Conversations)
  const [systemPrompt, setSystemPrompt] = useState<SystemPrompt>(SystemPrompt.FileConverter)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchApiKeys()
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

  const fetchApiKeys = async () => {
    try {
      const settings = await getSettingsFromFile()
      if (settings) {
        if (settings.openai_key) {
          setOpenaiApiKey(settings.openai_key)
        }
        if (settings.google_key) {
          setGoogleApiKey(settings.google_key)
        }
        if (settings.anthropic_key) {
          setAnthropicApiKey(settings.anthropic_key)
        }
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const getLLMInstance = (model: LLMModel = llmModel) => {
    console.log('Model:', model)
    switch (model) {
      case LLMModel.GPT_4o_mini:
        if (!openaiApiKey) {
          throw new Error('OpenAI API Key not set')
        }
        return createOpenAI({ apiKey: openaiApiKey })
      case LLMModel.GPT_4o:
        if (!openaiApiKey) {
          throw new Error('OpenAI API Key not set')
        }
        return createOpenAI({ apiKey: openaiApiKey })
      case LLMModel.gemini_1_5_pro:
        if (!googleApiKey) {
          throw new Error('Google API Key not set')
        }
        return createGoogleGenerativeAI({ apiKey: googleApiKey })
      case LLMModel.gemini_1_5_flash:
        if (!googleApiKey) {
          throw new Error('Google API Key not set')
        }
        return createGoogleGenerativeAI({ apiKey: googleApiKey })
      case LLMModel.claude_3_5_sonnet:
        if (!anthropicApiKey) {
          throw new Error('Anthropic API Key not set')
        }
        return createAnthropic({ apiKey: anthropicApiKey })
      default:
        throw new Error('Invalid LLM model')
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

  const handleNewConversation = useCallback(async () => {
    setCurrentConversation(null)
    setSelectedFiles([])
    setConversationFiles([])
    setInput('')
    textareaRef.current?.focus()
  }, [])

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
    if (openaiApiKey === null) {
      throw new Error('OpenAI API Key not set')
    }

    if (currentConversation === null) {
      const result = await createNewConversation('New Conversation')

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
      }
      return message
    })
  }

  const getSuitableAssistant = async (conversation: Conversation): Promise<SystemPrompt> => {
    const llm = getLLMInstance(llmModel)
    const result = await generateObject({
      model: llm(llmModel),
      schema: promptSchema,
      system: prompts.navigator,
      messages: createMessagesForLLM(conversation)
    })

    const parsedResult = promptSchema.safeParse(result.object)

    if (parsedResult.success) {
      const taskType = parsedResult.data.task

      switch (taskType) {
        case 'file-converter':
          return SystemPrompt.FileConverter
        case 'pre-processor':
          return SystemPrompt.PreProcessor
        case 'analyzer':
          return SystemPrompt.Analyzer
        default:
          return SystemPrompt.FileConverter
      }
    } else {
      console.error('Error parsing result:', parsedResult.error)
      throw new Error('Error parsing result')
    }
  }

  const streamAIResponse = async (
    conversation: Conversation,
    prompt: SystemPrompt
  ): Promise<Message> => {
    const llm = getLLMInstance()

    const result = await streamText({
      model: llm(llmModel),
      system: prompts.system[prompt],
      messages: createMessagesForLLM(conversation)
    })

    let fullResponse = ''
    const aiMessageId = conversation.messages.length + 1
    const newAIMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      systemPrompt: prompt
    }

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
    if (!userMessage) return
    try {
      const parsedUserMessage = InputSchema.parse({ input: userMessage })
      const userMessageId = (currentConversation?.messages.length || 0) + 1
      const userInput = parsedUserMessage.input

      const newUserMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: userInput,
        filePaths: selectedFiles,
        systemPrompt: systemPrompt
      }

      let updatedConversation = await createOrUpdateConversation({
        ...newUserMessage,
        content: userInput
      })

      const titlePromise = currentConversation === null ? generateTitle(userInput) : null
      setCurrentConversation(updatedConversation)

      setInput('')

      const newSystemPrompt = autoAssistantEnabled
        ? await getSuitableAssistant(updatedConversation)
        : systemPrompt
      handleSystemPromptChange(newSystemPrompt)

      setIsStreaming(true)
      const aiMessage = await streamAIResponse(updatedConversation, newSystemPrompt)
      setIsStreaming(false)

      if (titlePromise) {
        titlePromise.then((title) => {
          updatedConversation.title = title
        })
      }

      updatedConversation = updateConversation(updatedConversation, aiMessage)

      setCurrentConversation(updatedConversation)
      updateConversationsState(updatedConversation)

      await saveConversation(updatedConversation)
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Error processing input:', error)
      setIsStreaming(false)
      textareaRef.current?.focus()
    }
  }, [input, currentConversation, llmModel, selectedFiles, systemPrompt, autoAssistantEnabled])

  const generateTitle = async (userInput: string) => {
    const llm = getLLMInstance(LLMModel.GPT_4o_mini)
    const titleGenerationPrompt = replacePlaceholders(prompts.titleGeneration, {
      input: userInput
    })

    const result = await generateText({
      model: llm(LLMModel.GPT_4o_mini),
      prompt: titleGenerationPrompt,
      temperature: 0.5
    })

    const title = result.text.replace(/^["']|["']$/g, '').trim()

    return title
  }

  const handleExecutionResult = useCallback(
    async (
      messageId: number,
      executionResult: ExecutionResult,
      isLastMessage: boolean,
      prompt: SystemPrompt
    ) => {
      if (!currentConversation) return

      const updatedMessages = currentConversation.messages.map((message) =>
        message.id === messageId ? { ...message, executionResult } : message
      )

      let output = `Execution Result\n\n${executionResult.output || 'Script executed successfully with no standard output.'}`

      if (executionResult.figurePaths && executionResult.figurePaths.length > 0) {
        output += `\n${executionResult.figurePaths.length} figure(s) generated and showed successfully.`
      }

      if (isLastMessage) {
        updatedMessages.push({
          id: updatedMessages.length + 1,
          role: 'user',
          content: output,
          isExecutionMessage: true,
          systemPrompt: prompt
        })
      }

      const updatedConversation = { ...currentConversation, messages: updatedMessages }
      setCurrentConversation(updatedConversation)

      const newSystemPrompt = autoAssistantEnabled
        ? await getSuitableAssistant(updatedConversation)
        : systemPrompt
      handleSystemPromptChange(newSystemPrompt)

      if (isLastMessage) {
        setIsStreaming(true)
        const aiMessage = await streamAIResponse(updatedConversation, newSystemPrompt)
        setIsStreaming(false)

        const finalConversation = updateConversation(updatedConversation, aiMessage)
        setCurrentConversation(finalConversation)
        await saveConversation(finalConversation)
      }
    },
    [currentConversation]
  )

  const handleFileSelect = useCallback(
    (filePaths: string[]) => {
      if (filePaths.length > 0) {
        setSelectedFiles((prevFiles) => [...prevFiles, ...filePaths])
        setConversationFiles((prevFiles) => [...prevFiles, ...filePaths])
        setActiveTab(Tab.Files)
      }
    },
    [selectedFiles]
  )

  const handleTabChange = useCallback(
    (tab: Tab) => {
      setSelectedFiles([])
      setActiveTab((prevTab) => (prevTab === tab ? null : tab))
    },
    [activeTab]
  )

  const handleOpenAIApiKeyChange = useCallback(
    (newApiKey: string) => {
      setOpenaiApiKey(newApiKey)
    },
    [openaiApiKey]
  )

  const handleGoogleAPIKeyChange = useCallback(
    (newApiKey: string) => {
      setGoogleApiKey(newApiKey)
    },
    [googleApiKey]
  )

  const handleAnthropicAPIKeyChange = useCallback(
    (newApiKey: string) => {
      setAnthropicApiKey(newApiKey)
    },
    [anthropicApiKey]
  )

  const handleModelChange = useCallback(
    (newModel: LLMModel) => {
      setLlmModel(newModel)
      console.log('New model selected:', newModel)
    },
    [llmModel]
  )

  const handleSystemPromptChange = useCallback(
    (newPrompt: SystemPrompt) => {
      setSystemPrompt(newPrompt)
      console.log('New system prompt selected:', newPrompt)
    },
    [systemPrompt]
  )

  const renderChatInterface = () => {
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
        model={llmModel}
        onModelChange={handleModelChange}
        systemPrompt={systemPrompt}
        onSystemPromptChange={handleSystemPromptChange}
        autoAssistantEnabled={autoAssistantEnabled}
        setAutoAssistantEnabled={setAutoAssistantEnabled}
      />
    )
  }

  const renderContent = () => {
    if (activeTab === Tab.Settings) {
      return (
        <Settings
          onOpenAIApiKeyChange={handleOpenAIApiKeyChange}
          onGoogleApiKeyChange={handleGoogleAPIKeyChange}
          onAnthropicApiKeyChange={handleAnthropicAPIKeyChange}
        />
      )
    } else if (activeTab === Tab.Conversations) {
      return (
        <>
          <ConversationsHistory
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            onNewConversation={handleNewConversation}
            onLoadConversation={handleLoadConversation}
          />
          {renderChatInterface()}
        </>
      )
    } else if (activeTab === Tab.Files) {
      return (
        <>
          <FileArea filePaths={conversationFiles} />
          {renderChatInterface()}
        </>
      )
    }
    return renderChatInterface()
  }

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <SidebarNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      {renderContent()}
    </div>
  )
}

export default App
