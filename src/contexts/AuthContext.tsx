import React, { createContext, useContext, useEffect, useState } from 'react'
import { blink } from '../lib/blink'
import type { BlinkUser } from '@blinkdotnew/sdk'

interface AuthContextType {
  user: BlinkUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Listen for auth state changes - this is the proper way per the requirements
    const unsubscribe = blink.auth.onAuthStateChanged((authState) => {
      setUser(authState.user)
      setIsLoading(authState.isLoading)
    })

    return unsubscribe
  }, [])

  const signIn = async () => {
    try {
      await blink.auth.signIn()
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  const signOut = async () => {
    try {
      await blink.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}