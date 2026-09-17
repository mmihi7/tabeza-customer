'use client'

// /select-role — shown when a user has access to more than one Tabeza platform.
// Styled with the customer app's dark, amber-accent design system.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'

interface UserRole {
  type: 'staff' | 'crew' | 'customer' | 'tabeza'
  label: string
  description: string
  url: string
  barName?: string
}

export default function SelectRolePage() {
  const router = useRouter()
  const [roles, setRoles]           = useState<UserRole[]>([])
  const [loading, setLoading]       = useState(true)
  const [navigating, setNavigating] = useState<string | null>(null)
  const [error, setError]           = useState('')

  // True when dest points at this same app (same origin or relative path).
  function isSelfApp(dest: string): boolean {
    if (dest.startsWith('/')) return true
    try { return new URL(dest).origin === window.location.origin } catch { return false }
  }
  function pathOf(dest: string): string {
    try { const u = new URL(dest); return u.pathname + u.search } catch { return dest }
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const res = await fetch('/api/auth/roles', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        setError('Could not load your roles. Please try again.')
        setLoading(false)
        return
      }

      const data = await res.json()

      if (data.roles.length <= 1) {
        const dest = data.roles[0]?.url ?? '/start'
        if (isSelfApp(dest)) router.replace(pathOf(dest))
        else window.location.href = dest
        return
      }

      setRoles(data.roles)
      setLoading(false)
    }

    load()
  }, [router])

  function handlePick(role: UserRole) {
    setNavigating(role.type)
    if (isSelfApp(role.url)) router.push(pathOf(role.url))
    else window.location.href = role.url
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(255,79,0,0.2)', borderTopColor: 'var(--amber)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <Logo size="lg" />

      <h1 style={{ textAlign: 'center', margin: '3rem 0 2.5rem', color: 'var(--cream)', fontSize: '1.25rem', fontWeight: 400 }}>
        Choose your view
      </h1>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '-1.25rem 0 2rem', maxWidth: 380, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Panel — one raised surface. Every role carries equal weight. */}
      <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '0.75rem', padding: '0.5rem' }}>
        {roles.map((role, i) => {
          const isNavigating = navigating === role.type
          return (
            <button
              key={role.type}
              onClick={() => handlePick(role)}
              disabled={!!navigating}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderTop: i === 0 ? undefined : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                color: 'var(--cream)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                opacity: navigating && !isNavigating ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {isNavigating ? 'Loading…' : role.label}
            </button>
          )
        })}
      </div>

      <button onClick={handleSignOut} style={{ marginTop: '3.5rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
        Sign out
      </button>
    </div>
  )
}