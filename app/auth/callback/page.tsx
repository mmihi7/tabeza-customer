'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleCallback() {
      // ── 1. OAuth PKCE flow (Google etc.) ────────────────────────────
      // Supabase redirects with ?code=... in query params
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('[auth/callback] exchangeCodeForSession error:', error.message)
          router.replace('/login?error=oauth_failed')
          return
        }
        // Check if user has a consent record → returning user; else → new user
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const { data: consent } = await supabase
              .from('consent_records')
              .select('id')
              .eq('user_id', session.user.id)
              .limit(1)
              .maybeSingle()

            if (!consent) {
              // First time Google user — needs consent
              router.replace('/signup?step=consent')
              return
            }

            // Multi-role check
            const rolesRes = await fetch('/api/auth/roles', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            if (rolesRes.ok) {
              const { roles } = await rolesRes.json()
              if (roles.length > 1) {
                router.replace('/select-role')
                return
              }
            }

            router.replace('/start')
            return
          }
        } catch {
          // Non-fatal — fall through to start
        }
        router.replace('/start')
        return
      }

      // ── 2. Hash fragment flow (email confirmation links) ─────────────
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)

      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type         = params.get('type') // 'signup' | 'recovery' | 'invite'

      if (accessToken && refreshToken) {
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

      if (type === 'signup') {
        router.replace('/signup?step=consent')
      } else if (type === 'recovery') {
        router.replace('/reset-password')
      } else {
        // Magic link login — check for multiple roles
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const rolesRes = await fetch('/api/auth/roles', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            if (rolesRes.ok) {
              const { roles } = await rolesRes.json()
              if (roles.length > 1) {
                router.replace('/select-role')
                return
              }
            }
          }
        } catch {
          // Non-fatal
        }
        router.replace('/start')
      }
    }

    handleCallback()
  }, [router, searchParams])

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
          Signing you in...
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
