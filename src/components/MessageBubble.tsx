import { Copy, User } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { MarkdownRenderer } from './MarkdownRenderer'
import { toast } from 'react-hot-toast'
import { type Message } from '../lib/blink'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className={`group flex gap-4 p-6 ${isUser ? 'bg-transparent' : 'bg-muted/30'}`}>
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/ai-avatar.png" alt="AI" />
            <AvatarFallback className="bg-green-500 text-white">
              AI
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {isUser ? 'You' : 'ChatGPT'}
          </span>
        </div>

        <div className="text-sm leading-relaxed">
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <MarkdownRenderer 
              content={message.content} 
              isStreaming={isStreaming}
            />
          )}
        </div>

        {!isUser && message.content && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={copyToClipboard}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}