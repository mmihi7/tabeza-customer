'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      // Parse the hash fragment — Supabase puts the tokens here for email links
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)

      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type         = params.get('type') // 'signup' | 'recovery' | 'invite' etc.

      if (accessToken && refreshToken) {
        // Exchange the tokens so Supabase stores the session
        const { error } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          console.error('[auth/callback] setSession error:', error.message)
          router.replace('/login?error=callback_failed')
          return
        }
      }

      // Route based on the link type
      if (type === 'signup') {
        // New user confirmed their email — send them to the consent step
        // The signup page reads this flag and jumps to step 4 (consent)
        router.replace('/signup?step=consent')
      } else if (type === 'recovery') {
        router.replace('/reset-password')
      } else {
        // Fallback — go to start screen (StepHome with recent venues)
        router.replace('/start')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--ink)',
        padding: '24px 16px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: 48,
            height: 48,
            borderTop: '3px solid var(--amber)',
            borderBottom: '3px solid var(--amber)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 16,
          }}
        />
        <p
          style={{
            color: 'var(--muted)',
            fontFamily: 'Lato, sans-serif',
            fontSize: '1rem',
            margin: 0,
          }}
        >
          Verifying your email...
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
