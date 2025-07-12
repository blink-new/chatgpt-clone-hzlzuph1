import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  isStreaming?: boolean
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className="space-y-2">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '')
              const language = match ? match[1] : ''
              
              if (inline) {
                return (
                  <code
                    className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                )
              }
              
              return (
                <div className="relative">
                  <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                    {language}
                  </div>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono" {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/20 pl-4 italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-border">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-4 py-2">
                {children}
              </td>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1">
                {children}
              </ol>
            ),
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-4">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mb-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-medium mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-2 leading-relaxed">{children}</p>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {isStreaming && (
        <div className="inline-flex items-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}