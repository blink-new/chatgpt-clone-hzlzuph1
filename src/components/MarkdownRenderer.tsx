import { useEffect, useState } from 'react'

interface MarkdownRendererProps {
  content: string
  isStreaming?: boolean
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  const [displayContent, setDisplayContent] = useState(content)

  useEffect(() => {
    setDisplayContent(content)
  }, [content])

  // Simple markdown-like parsing for demo purposes
  const parseContent = (text: string) => {
    let parsed = text
    
    // Bold text
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic text
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code blocks
    parsed = parsed.replace(/```(.*?)```/gs, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>')
    
    // Inline code
    parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    
    // Line breaks
    parsed = parsed.replace(/\n/g, '<br>')
    
    return parsed
  }

  return (
    <div className="space-y-2">
      <div 
        dangerouslySetInnerHTML={{ 
          __html: parseContent(displayContent) 
        }}
        className="whitespace-pre-wrap"
      />
      {isStreaming && (
        <div className="inline-flex items-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}