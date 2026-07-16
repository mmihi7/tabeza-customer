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

const ROLE_META: Record<UserRole['type'], { icon: string; accent: string; bg: string }> = {
  tabeza:   { icon: '🏢', accent: '#FF4F00', bg: 'rgba(255,79,0,0.08)'   },
  staff:    { icon: '🍸', accent: '#FF7033', bg: 'rgba(255,112,51,0.08)' },
  crew:     { icon: '🧑‍🍳', accent: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  customer: { icon: '🪑', accent: '#FF4F00', bg: 'rgba(255,79,0,0.08)'   },
}

export default function SelectRolePage() {
  const router = useRouter()
  const [roles, setRoles]           = useState<UserRole[]>([])
  const [loading, setLoading]       = useState(true)
  const [navigating, setNavigating] = useState<string | null>(null)
  const [error, setError]           = useState('')

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
        if (dest.startsWith('/') || dest.includes('app.tabeza.co.ke') || dest.includes('localhost:3002')) {
          router.replace(dest.startsWith('http') ? '/start' : dest)
        } else {
          window.location.href = dest
        }
        return
      }

      setRoles(data.roles)
      setLoading(false)
    }

    load()
  }, [router])

  function handlePick(role: UserRole) {
    setNavigating(role.type)
    if (role.url.includes('app.tabeza.co.ke') || role.url.includes('localhost:3002') || role.url.startsWith('/')) {
      router.push(role.url.startsWith('http') ? '/start' : role.url)
    } else {
      window.location.href = role.url
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(255,79,0,0.2)',
          borderTopColor: 'var(--amber)',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      fontFamily: "'Lato', sans-serif",
    }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .role-card {
          animation: fadeUp 0.35s ease both;
          cursor: pointer;
          transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .role-card:hover  { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
        .role-card:active { transform: translateY(0); }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
        <Logo size="lg" />
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', maxWidth: 320 }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2rem', fontWeight: 600,
          color: 'var(--cream)',
          marginBottom: '0.625rem',
        }}>
          Choose your view
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          {roles.some(r => r.type === 'tabeza')
            ? 'You have platform and app access. Choose where to go.'
            : 'Your account has access to multiple Tabeza platforms.'
          }
        </p>
      </div>

      {error && (
        <div style={{
          color: 'var(--danger)',
          background: 'rgba(232,96,96,0.08)',
          border: '1px solid rgba(232,96,96,0.2)',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          width: '100%',
          maxWidth: 380,
        }}>
          {error}
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%', maxWidth: 380 }}>
        {roles.map((role, i) => {
          const meta = ROLE_META[role.type]
          const isNavigating = navigating === role.type
          const isAdmin = role.type === 'tabeza'

          if (isAdmin) {
            return (
              <button
                key={role.type}
                className="role-card"
                onClick={() => handlePick(role)}
                disabled={!!navigating}
                style={{
                  animationDelay: `${i * 0.07}s`,
                  background: 'linear-gradient(135deg, rgba(255,79,0,0.14) 0%, rgba(255,79,0,0.05) 100%)',
                  border: `1px solid ${isNavigating ? '#FF4F00' : 'rgba(255,79,0,0.4)'}`,
                  borderRadius: 12,
                  padding: '1.25rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  textAlign: 'left', width: '100%',
                  opacity: navigating && !isNavigating ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                  boxShadow: '0 2px 16px rgba(255,79,0,0.12)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 80, height: 80,
                  background: 'radial-gradient(circle, rgba(255,79,0,0.18) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  width: 52, height: 52, borderRadius: 10,
                  background: 'rgba(255,79,0,0.15)',
                  border: '1px solid rgba(255,79,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', flexShrink: 0,
                }}>
                  {isNavigating
                    ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,79,0,0.3)', borderTopColor: '#FF4F00', animation: 'spin 0.7s linear infinite' }} />
                    : '⚡'
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--cream)', fontFamily: "'Lato', sans-serif" }}>{role.label}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--amber)', background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.25)', borderRadius: '0.25rem', padding: '0.1rem 0.4rem' }}>
                      Platform
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role.description}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--amber)', flexShrink: 0 }}>
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          }

          return (
            <button
              key={role.type}
              className="role-card"
              onClick={() => handlePick(role)}
              disabled={!!navigating}
              style={{
                animationDelay: `${i * 0.07}s`,
                background: 'var(--ink2)',
                border: `1px solid ${isNavigating ? meta.accent : 'var(--border)'}`,
                borderRadius: 12,
                padding: '1.125rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textAlign: 'left',
                width: '100%',
                opacity: navigating && !isNavigating ? 0.4 : 1,
                transition: 'opacity 0.15s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{
                width: 50, height: 50,
                borderRadius: 10,
                background: meta.bg,
                border: `1px solid ${meta.accent}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.375rem',
                flexShrink: 0,
              }}>
                {isNavigating
                  ? <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${meta.accent}30`,
                      borderTopColor: meta.accent,
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  : meta.icon
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--cream)', marginBottom: '0.25rem', fontFamily: "'Lato', sans-serif" }}>{role.label}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role.description}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: meta.accent, flexShrink: 0 }}>
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleSignOut}
        style={{
          marginTop: '2rem',
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          fontFamily: "'Lato', sans-serif",
          fontSize: '0.8125rem',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
