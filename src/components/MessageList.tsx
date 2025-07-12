import { MessageBubble } from './MessageBubble'
import { type Message } from '../lib/blink'

interface MessageListProps {
  messages: Message[]
  isStreaming?: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  return (
    <div className="flex flex-col">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1
        const isStreamingThisMessage = isStreaming && isLastMessage && message.role === 'assistant'
        
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreamingThisMessage}
          />
        )
      })}
    </div>
  )
}