'use client'

// /choose-app — shown when a signed-in user lands on the customer app but
// does NOT have a customer profile here (no consent record), while already
// belonging to another Tabeza app (crew, staff). They get to either create a
// customer account here or continue to an app they already use.

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

// The only role that gives access to THIS app is `customer` (consent record).
const LOCAL_ROLES: UserRole['type'][] = ['customer']

// Friendly display name for each existing account kind.
const APP_LABEL: Record<string, string> = {
  crew:     'crew app',
  customer: 'customer app',
  staff:    'venue app',
  tabeza:   'Tabeza HQ',
}
const APP_NOUN: Record<string, string> = {
  crew:     'crew',
  customer: 'customer',
  staff:    'venue',
  tabeza:   'Tabeza HQ',
}

const PRIMARY_LABEL = 'Create customer account'

export default function ChooseAppPage() {
  const router = useRouter()
  const [roles, setRoles]           = useState<UserRole[]>([])
  const [loading, setLoading]       = useState(true)
  const [navigating, setNavigating] = useState<string | null>(null)
  const [error, setError]           = useState('')

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
        setError('Could not load your accounts. Please try again.')
        setLoading(false)
        return
      }

      const data = await res.json()

      // They already have a customer profile — send them to the customer app.
      if (data.roles.some((r: UserRole) => r.type === 'customer')) {
        router.replace('/start')
        return
      }

      const otherRoles = data.roles.filter((r: UserRole) => !LOCAL_ROLES.includes(r.type))

      // No other app to pivot to — go straight to customer onboarding.
      if (otherRoles.length === 0) {
        router.replace('/signup?step=consent')
        return
      }

      setRoles(otherRoles)
      setLoading(false)
    }

    load()
  }, [router])

  function goTo(dest: string, key: string) {
    setNavigating(key)
    if (isSelfApp(dest)) router.push(pathOf(dest))
    else window.location.href = dest
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const target  = roles[0]?.type
  const noun    = target ? APP_NOUN[target] ?? 'Tabeza' : ''
  const label   = target ? APP_LABEL[target] ?? 'Tabeza' : ''
  const caption = roles.length === 1
    ? `You're signed in with a ${noun} account.`
    : 'You have more than one Tabeza account.'

  const heading = roles.length === 1
    ? `Create a customer account, or go to your ${label}?`
    : roles.length > 1
      ? 'Create a customer account, or go to an app you already use?'
      : 'Create your customer account to get started.'

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

      {/* Heading — the brand question reads as one unit under the logo. */}
      <div style={{ textAlign: 'center', margin: '2.75rem 0 2.5rem', maxWidth: 420 }}>
        <h1 style={{ color: 'var(--cream)', fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.55 }}>
          {heading}
        </h1>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '-1.5rem 0 1.75rem', maxWidth: 380, textAlign: 'center' }}>
          {error}
        </div>
      )}

{/* Ledger panel — one raised surface. Every direction carries equal weight. */}
      <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '0.75rem', padding: '0.5rem' }}>
        {[
          { key: 'customer', label: PRIMARY_LABEL, run: () => goTo('/signup?step=consent', 'customer') },
          ...roles.map((role) => ({
            key: role.type,
            label: `Go to my ${APP_LABEL[role.type] ?? 'Tabeza app'}`,
            run: () => goTo(role.url, role.type),
          })),
        ].map((opt, i) => {
          const isNavigating = navigating === opt.key
          return (
            <button
              key={opt.key}
              onClick={opt.run}
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
              {isNavigating ? 'Loading…' : opt.label}
            </button>
          )
        })}
      </div>

      <button onClick={handleSignOut} style={{ marginTop: '2.5rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
        Sign out
      </button>

      <p style={{ color: 'var(--muted)', fontSize: '0.6875rem', marginTop: '1rem', lineHeight: 1.5 }}>
        {caption}
      </p>
    </div>
  )
}