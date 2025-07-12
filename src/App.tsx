import { useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/Sidebar'
import { ThemeProvider } from './components/ThemeProvider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable'
import { ChatProvider } from './contexts/ChatContext'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ThemeProvider defaultTheme="light">
      <ChatProvider>
        <div className="h-screen w-full bg-background text-foreground">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {sidebarOpen && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                  <Sidebar />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel defaultSize={sidebarOpen ? 80 : 100}>
              <ChatInterface 
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatProvider>
    </ThemeProvider>
  )
}

export default App