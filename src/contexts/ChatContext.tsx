import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { blink, chatSessionsTable, messagesTable, type ChatSession, type Message } from '../lib/blink'
import { toast } from 'react-hot-toast'

interface ChatContextType {
  chatSessions: ChatSession[]
  currentChatSession: ChatSession | null
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  selectedModel: string
  
  // Actions
  createNewChat: () => Promise<ChatSession | null>
  selectChatSession: (sessionId: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  deleteChat: (sessionId: string) => Promise<void>
  updateChatTitle: (sessionId: string, title: string) => Promise<void>
  regenerateResponse: () => Promise<void>
  stopGeneration: () => void
  setSelectedModel: (model: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const AVAILABLE_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', description: 'More capable model, better at complex tasks' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Faster responses, good for most tasks' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest model with improved performance' }
]

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Load chat sessions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadChatSessions()
    } else {
      // Clear data when not authenticated
      setChatSessions([])
      setCurrentChatSession(null)
      setMessages([])
    }
  }, [isAuthenticated, user])

  // Load messages when current chat session changes
  useEffect(() => {
    if (currentChatSession) {
      loadMessages(currentChatSession.id)
      // Update model from session
      setSelectedModel(currentChatSession.model)
    } else {
      setMessages([])
    }
  }, [currentChatSession])

  const loadChatSessions = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const sessions = await chatSessionsTable
        .query()
        .filter({ userId: user.id })
        .orderBy('createdAt', 'desc')
        .execute()
      
      setChatSessions(sessions)
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (sessionId: string) => {
    setIsLoading(true)
    try {
      const sessionMessages = await messagesTable
        .query()
        .filter({ chatSessionId: sessionId })
        .orderBy('createdAt', 'asc')
        .execute()
      
      setMessages(sessionMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  const createNewChat = async (): Promise<ChatSession | null> => {
    if (!user) {
      toast.error('Please sign in to start a chat')
      return null
    }

    try {
      const newSession: Omit<ChatSession, 'id'> = {
        userId: user.id,
        createdAt: new Date(),
        title: 'New Chat',
        model: selectedModel
      }

      const created = await chatSessionsTable.create(newSession)
      
      if (created && created.length > 0) {
        const session = created[0]
        setChatSessions(prev => [session, ...prev])
        setCurrentChatSession(session)
        return session
      }
    } catch (error) {
      console.error('Failed to create new chat:', error)
      toast.error('Failed to create new chat')
    }
    
    return null
  }

  const selectChatSession = async (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentChatSession(session)
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentChatSession || !user || isStreaming) return

    // Create abort controller for this request
    const controller = new AbortController()
    setAbortController(controller)
    setIsStreaming(true)

    try {
      // Add user message to database
      const userMessage: Omit<Message, 'id'> = {
        chatSessionId: currentChatSession.id,
        role: 'user',
        content,
        createdAt: new Date(),
        isEdited: false
      }

      const createdUserMessage = await messagesTable.create(userMessage)
      if (createdUserMessage && createdUserMessage.length > 0) {
        setMessages(prev => [...prev, createdUserMessage[0]])
      }

      // Update chat title if this is the first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        await updateChatTitle(currentChatSession.id, title)
      }

      // Create assistant message placeholder
      const assistantMessage: Omit<Message, 'id'> = {
        chatSessionId: currentChatSession.id,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
        isEdited: false
      }

      const createdAssistantMessage = await messagesTable.create(assistantMessage)
      if (createdAssistantMessage && createdAssistantMessage.length > 0) {
        const assistantMsg = createdAssistantMessage[0]
        setMessages(prev => [...prev, assistantMsg])

        // Generate AI response with streaming
        await generateAIResponse(content, assistantMsg.id, controller.signal)
      }

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to send message:', error)
        toast.error('Failed to send message')
      }
    } finally {
      setIsStreaming(false)
      setAbortController(null)
    }
  }

  const generateAIResponse = async (userMessage: string, messageId: string, signal: AbortSignal) => {
    try {
      // Use Blink AI streaming
      const stream = await blink.ai.streamText({
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.' },
          { role: 'user', content: userMessage }
        ],
        model: selectedModel,
        maxTokens: 1000
      })

      let fullResponse = ''

      for await (const chunk of stream) {
        if (signal.aborted) {
          throw new Error('AbortError')
        }

        if (chunk.content) {
          fullResponse += chunk.content
          
          // Update message in database and local state
          await messagesTable.update(messageId, { content: fullResponse })
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: fullResponse }
              : msg
          ))
        }
      }

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('AI generation error:', error)
        toast.error('Failed to generate response')
        
        // Update with error message
        await messagesTable.update(messageId, { 
          content: 'Sorry, I encountered an error generating a response. Please try again.' 
        })
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: 'Sorry, I encountered an error generating a response. Please try again.' }
            : msg
        ))
      }
    }
  }

  const deleteChat = async (sessionId: string) => {
    try {
      // Delete all messages first
      await messagesTable.query().filter({ chatSessionId: sessionId }).delete()
      
      // Delete the session
      await chatSessionsTable.delete(sessionId)
      
      // Update local state
      setChatSessions(prev => prev.filter(s => s.id !== sessionId))
      
      if (currentChatSession?.id === sessionId) {
        setCurrentChatSession(null)
        setMessages([])
      }
      
      toast.success('Chat deleted')
    } catch (error) {
      console.error('Failed to delete chat:', error)
      toast.error('Failed to delete chat')
    }
  }

  const updateChatTitle = async (sessionId: string, title: string) => {
    try {
      await chatSessionsTable.update(sessionId, { title })
      
      // Update local state
      setChatSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title } : s
      ))
      
      if (currentChatSession?.id === sessionId) {
        setCurrentChatSession(prev => prev ? { ...prev, title } : null)
      }
    } catch (error) {
      console.error('Failed to update chat title:', error)
    }
  }

  const regenerateResponse = async () => {
    if (!currentChatSession || messages.length < 2) return

    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) return

    // Remove the last assistant message if it exists
    const lastAssistantMessage = messages[messages.length - 1]
    if (lastAssistantMessage && lastAssistantMessage.role === 'assistant') {
      try {
        await messagesTable.delete(lastAssistantMessage.id)
        setMessages(prev => prev.slice(0, -1))
      } catch (error) {
        console.error('Failed to delete last message:', error)
      }
    }

    // Regenerate response
    await sendMessage(lastUserMessage.content)
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setIsStreaming(false)
      setAbortController(null)
    }
  }

  const handleModelChange = async (model: string) => {
    setSelectedModel(model)
    
    // Update current session model if there is one
    if (currentChatSession) {
      await chatSessionsTable.update(currentChatSession.id, { model })
      setCurrentChatSession(prev => prev ? { ...prev, model } : null)
    }
  }

  const value = {
    chatSessions,
    currentChatSession,
    messages,
    isLoading,
    isStreaming,
    selectedModel,
    createNewChat,
    selectChatSession,
    sendMessage,
    deleteChat,
    updateChatTitle,
    regenerateResponse,
    stopGeneration,
    setSelectedModel: handleModelChange
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export { AVAILABLE_MODELS }