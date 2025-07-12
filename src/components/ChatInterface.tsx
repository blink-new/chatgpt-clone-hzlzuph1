import { useState, useRef, useEffect } from 'react'
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
  ArrowDown
} from 'lucide-react'
import { cn } from '../lib/utils'

interface ChatInterfaceProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function ChatInterface({ onToggleSidebar, sidebarOpen }: ChatInterfaceProps) {
  const { currentChat, createNewChat, addMessage, isStreaming, setIsStreaming, updateMessage } = useChat()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const chatId = currentChat?.id || createNewChat()
    const userMessage = input.trim()
    setInput('')

    // Add user message
    addMessage(chatId, {
      content: userMessage,
      role: 'user'
    })

    // Simulate AI response with streaming
    setIsStreaming(true)
    
    // Add the streaming assistant message and get its ID
    const messageId = addMessage(chatId, {
      content: '',
      role: 'assistant',
      isStreaming: true
    })
    
    // Simulate streaming response
    simulateStreamingResponse(chatId, userMessage, messageId)
  }

  const simulateStreamingResponse = async (chatId: string, userMessage: string, messageId: string) => {
    // Simulate different responses based on user input
    const response = generateResponse(userMessage)
    
    const words = response.split(' ')
    let currentResponse = ''
    
    // Wait a brief moment for the message to be added
    await new Promise(resolve => setTimeout(resolve, 100))
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
      currentResponse += (i > 0 ? ' ' : '') + words[i]
      
      // Update the streaming message
      updateMessage(chatId, messageId, currentResponse)
    }
    
    setIsStreaming(false)
  }

  const generateResponse = (userMessage: string): string => {
    const responses = [
      "I understand you're asking about " + userMessage.toLowerCase() + ". This is a fascinating topic that has many layers to explore. Let me share some insights that might be helpful.",
      
      "That's an excellent question! Based on what you've mentioned, I can provide several perspectives on this matter. The key considerations include...",
      
      "I appreciate you bringing this up. This subject involves multiple dimensions that we should consider carefully. Here's my analysis:",
      
      "Thanks for that question about " + userMessage.toLowerCase().slice(0, 50) + "... This touches on some important concepts. Let me break this down for you:",
      
      "What an interesting perspective! You've raised a point that connects to several broader themes. I'd like to explore this with you step by step."
    ]
    
    return responses[Math.floor(Math.random() * responses.length)] + " " + 
           "This is a simulated response to demonstrate the chat interface. In a real implementation, this would connect to an actual AI service like OpenAI's GPT API. The streaming effect you see here mimics how real AI responses are typically delivered token by token."
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

  const handleStopGeneration = () => {
    setIsStreaming(false)
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
            {currentChat?.title || 'New Chat'}
          </h1>
        </div>
        
        <ModelSelector />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 relative">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          {currentChat ? (
            <MessageList messages={currentChat.messages} />
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
                      onClick={handleStopGeneration}
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
            {currentChat && currentChat.messages.length > 0 && !isStreaming && (
              <div className="flex justify-center mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Regenerate response
                </Button>
              </div>
            )}
          </form>
          
          <div className="text-xs text-muted-foreground text-center mt-2">
            This is a demo ChatGPT clone. Responses are simulated.
          </div>
        </div>
      </div>
    </div>
  )
}