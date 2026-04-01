'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { getDeviceId } from '@/lib/device-identity'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // No session, user signed out
        setUser(null)
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Link device to user when user logs in
  useEffect(() => {
    if (!user) return
    linkDeviceToUser(user)
  }, [user])

  const linkDeviceToUser = async (user: User) => {
    try {
      const deviceId = await getDeviceId()
      if (!deviceId || deviceId.startsWith('temp_')) {
        console.log('⚠️ No persistent device ID found, skipping device linking')
        return
      }
      
      // Get current session to include JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.log('⚠️ No session token found, skipping device linking')
        return
      }
      
      console.log('🔗 Linking device to user:', deviceId.substring(0, 12))
      const response = await fetch('/api/user/link-device', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ deviceId }),
      })
      if (!response.ok) {
        const error = await response.json()
        console.warn('⚠️ Failed to link device:', error)
        return
      }
      console.log('✅ Device linked successfully')
    } catch (error) {
      console.error('❌ Device linking error:', error)
      // Non-critical, ignore
    }
  }

  const checkAuth = async () => {
    try {
      console.log('🔐 Checking authentication...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Auth session error:', error)
        setUser(null)
        return
      }
      
      if (!session) {
        console.log('❌ No session found')
        setUser(null)
        return
      }

      console.log('✅ Session found:', { userId: session.user.id, email: session.user.email })
      setUser(session.user)
    } catch (error) {
      console.error('❌ Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('tabeza-customer-auth')
      console.log('✅ Signed out successfully')
      router.push('/')
    } catch (error) {
      console.error('❌ Error signing out:', error)
    }
  }

  return { user, loading, signOut }
}