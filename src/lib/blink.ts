import { createClient } from '@blinkdotnew/sdk'

// Create Blink client instance
export const blink = createClient()

// Types for our database schema
export interface ChatSession {
  id: string
  userId: string
  createdAt: Date
  title: string
  model: string
}

export interface Message {
  id: string
  chatSessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  isEdited: boolean
}

// Database table references
export const chatSessionsTable = blink.data.table<ChatSession>('chat_sessions')
export const messagesTable = blink.data.table<Message>('messages')