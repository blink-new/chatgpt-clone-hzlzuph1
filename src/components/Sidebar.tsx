import { useState } from 'react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  Plus, 
  MessageSquare, 
  MoreHorizontal, 
  Trash2, 
  Settings,
  LogOut,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../lib/utils'

export function Sidebar() {
  const { 
    chatSessions, 
    currentChatSession, 
    createNewChat, 
    selectChatSession, 
    deleteChat,
    isLoading 
  } = useChat()
  const { user, signOut } = useAuth()
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingChatId(chatId)
    try {
      await deleteChat(chatId)
    } finally {
      setDeletingChatId(null)
    }
  }

  const formatChatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="flex h-full flex-col bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">ChatGPT</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={createNewChat}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                  currentChatSession?.id === session.id && "bg-muted"
                )}
                onClick={() => selectChatSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatChatDate(session.createdAt)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteChat(session.id, e)}
                      className="text-destructive"
                      disabled={deletingChatId === session.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletingChatId === session.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
                  <AvatarFallback>
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Sign in to save your chats
            </p>
          </div>
        )}
      </div>
    </div>
  )
}