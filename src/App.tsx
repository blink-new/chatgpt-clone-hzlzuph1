import { useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/Sidebar'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App