import { createContext, useContext, useState, ReactNode } from 'react'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isStreaming?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatContextType {
  chats: Chat[]
  currentChatId: string | null
  currentChat: Chat | null
  isStreaming: boolean
  createNewChat: () => string
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (chatId: string, messageId: string, content: string) => void
  deleteChat: (chatId: string) => void
  setCurrentChat: (chatId: string) => void
  setIsStreaming: (streaming: boolean) => void
  regenerateResponse: (chatId: string, messageId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const currentChat = chats.find(chat => chat.id === currentChatId) || null

  const createNewChat = (): string => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    return newChat.id
  }

  const addMessage = (chatId: string, message: Omit<Message, 'id' | 'timestamp'>): string => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }

    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, newMessage],
          updatedAt: new Date()
        }
        
        // Update title if this is the first user message
        if (chat.messages.length === 0 && message.role === 'user') {
          updatedChat.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
        }
        
        return updatedChat
      }
      return chat
    }))

    return newMessage.id
  }

  const updateMessage = (chatId: string, messageId: string, content: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId ? { ...msg, content, isStreaming: false } : msg
          ),
          updatedAt: new Date()
        }
      }
      return chat
    }))
  }

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }
  }

  const setCurrentChat = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  const regenerateResponse = (chatId: string, messageId: string) => {
    // Find the message and remove all messages after it
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const messageIndex = chat.messages.findIndex(msg => msg.id === messageId)
        if (messageIndex !== -1) {
          return {
            ...chat,
            messages: chat.messages.slice(0, messageIndex),
            updatedAt: new Date()
          }
        }
      }
      return chat
    }))
  }

  const value: ChatContextType = {
    chats,
    currentChatId,
    currentChat,
    isStreaming,
    createNewChat,
    addMessage,
    updateMessage,
    deleteChat,
    setCurrentChat,
    setIsStreaming,
    regenerateResponse
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