'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Wait for Supabase to process the session from the URL fragment
    const timeout = setTimeout(() => {
      // Redirect to home after a short delay
      router.push('/')
    }, 2000)

    // Cleanup
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Completing sign‑in...</p>
      </div>
    </div>
  )
}