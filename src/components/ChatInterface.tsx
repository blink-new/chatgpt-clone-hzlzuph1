import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { MessageList } from './MessageList'
import { ModelSelector } from './ModelSelector'
import { 
  Send, 
  Menu,
  RotateCcw,
  Square,
  ArrowDown,
  LogIn
} from 'lucide-react'
import { cn } from '../lib/utils'

interface ChatInterfaceProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function ChatInterface({ onToggleSidebar, sidebarOpen }: ChatInterfaceProps) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth()
  const { 
    currentChatSession, 
    messages, 
    isStreaming, 
    sendMessage, 
    regenerateResponse, 
    stopGeneration,
    createNewChat
  } = useChat()
  
  const [input, setInput] = useState('')
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Handle scroll to bottom visibility
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollElement) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 100)
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollElement) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming || !isAuthenticated) return

    const messageContent = input.trim()
    setInput('')

    // Create new chat if none exists
    if (!currentChatSession) {
      await createNewChat()
    }

    // Send the message
    await sendMessage(messageContent)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
  }

  const scrollToBottom = () => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollElement) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' })
    }
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth required state
  if (!isAuthenticated) {
    return (
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-xl font-semibold">ChatGPT</h1>
          </div>
        </div>

        {/* Auth Required Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md px-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Welcome to ChatGPT
              </h2>
              <p className="text-muted-foreground">
                Sign in to start chatting with AI and save your conversation history
              </p>
            </div>
            <Button 
              onClick={signIn}
              className="w-full"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-xl font-semibold">
            {currentChatSession?.title || 'New Chat'}
          </h1>
        </div>
        
        <ModelSelector />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 relative">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          {messages.length > 0 ? (
            <MessageList messages={messages} isStreaming={isStreaming} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground">
                  Start a conversation by typing a message below
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message ChatGPT..."
                  className={cn(
                    "min-h-[52px] max-h-[200px] resize-none pr-12 py-3 text-sm",
                    "focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                  disabled={isStreaming}
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {isStreaming ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={stopGeneration}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 transition-colors",
                        input.trim() 
                          ? "hover:bg-primary hover:text-primary-foreground" 
                          : "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!input.trim() || isStreaming}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Regenerate button for last message */}
            {messages.length > 0 && !isStreaming && (
              <div className="flex justify-center mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={regenerateResponse}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Regenerate response
                </Button>
              </div>
            )}
          </form>
          
          <div className="text-xs text-muted-foreground text-center mt-2">
            ChatGPT can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  )
}