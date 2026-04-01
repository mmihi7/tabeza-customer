'use client'

/**
 * AuthContext — single auth subscription for the entire app.
 * Replaces the per-component useAuth hook pattern which was creating
 * multiple simultaneous getSession() calls and hitting Supabase rate limits.
 */

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { getDeviceId } from '@/lib/device-identity'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const deviceLinked = useRef(false)

  useEffect(() => {
    // Single getSession call on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Single auth state listener for the whole app
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Link device once per session — not on every render
  useEffect(() => {
    if (!user || deviceLinked.current) return
    deviceLinked.current = true
    linkDevice(user)
  }, [user])

  async function linkDevice(u: User) {
    try {
      const deviceId = await getDeviceId()
      if (!deviceId || deviceId.startsWith('temp_')) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      await fetch('/api/user/link-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ deviceId }),
      })
    } catch {
      // Non-critical
    }
  }

  async function signOut() {
    deviceLinked.current = false
    await supabase.auth.signOut()
    localStorage.removeItem('tabeza-customer-auth')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
