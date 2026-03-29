'use client'

import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates email and password for the Account step.
 * Exported for use in property-based tests (task 3.3).
 * Requirements: 2.3
 */
export function validateAccountStep(
  email: string,
  password: string
): { valid: boolean; error: string | null } {
  // RFC 5322 basic email check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address.' }
  }
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.' }
  }
  return { valid: true, error: null }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StepAccountProps {
  email: string
  password: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onNext: (userId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepAccount({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onNext,
}: StepAccountProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Inline validation before calling Supabase — Requirements: 2.3
    const validation = validateAccountStep(email, password)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() ?? ''
        if (
          msg.includes('already registered') ||
          msg.includes('user already exists') ||
          msg.includes('already been registered')
        ) {
          setError('An account with this email already exists. Sign in instead.')
        } else {
          setError(signUpError.message || 'Failed to create account.')
        }
        return
      }

      // Supabase returns success with no session for repeated signups (security behaviour).
      // Detect this: a real new signup returns a user with an identities array.
      // A repeated signup returns a user with an empty identities array.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        setError('An account with this email already exists. Sign in instead.')
        return
      }

      // Success — pass the new user's ID up so the wizard can use it at consent step
      onNext(data.user?.id ?? '')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection error — please try again'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Heading */}
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2rem',
          fontWeight: 600,
          color: 'var(--cream)',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Create your account
      </h1>
      <p
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: '0.875rem',
          color: 'var(--muted)',
          textAlign: 'center',
          marginBottom: 32,
        }}
      >
        Join Tabeza and start enjoying your venues
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Email field */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="signup-email"
            style={{
              display: 'block',
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--cream)',
              marginBottom: 6,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Mail size={16} />
            </span>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                background: 'var(--ink)',
                border: '1px solid var(--amber-border)',
                borderRadius: 8,
                color: 'var(--cream)',
                fontFamily: 'Lato, sans-serif',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--amber-border)')}
            />
          </div>
        </div>

        {/* Password field */}
        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="signup-password"
            style={{
              display: 'block',
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--cream)',
              marginBottom: 6,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Lock size={16} />
            </span>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Min. 6 characters"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 44px 12px 40px',
                background: 'var(--ink)',
                border: '1px solid var(--amber-border)',
                borderRadius: 8,
                color: 'var(--cream)',
                fontFamily: 'Lato, sans-serif',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--amber-border)')}
            />
            {/* Show/hide toggle — Requirements: task spec */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p
            style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.75rem',
              color: 'var(--muted)',
              marginTop: 4,
            }}
          >
            At least 6 characters
          </p>
        </div>

        {/* Inline error — Requirements: 2.3, 2.4 */}
        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 12px',
              background: 'rgba(232,96,96,0.08)',
              border: '1px solid rgba(232,96,96,0.25)',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
            <span
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.875rem',
                color: 'var(--danger)',
                lineHeight: 1.4,
              }}
            >
              {error}
              {/* If "already exists" error, show sign-in link */}
              {error.includes('Sign in instead') && (
                <>
                  {' '}
                  <Link
                    href="/login"
                    style={{ color: 'var(--amber)', textDecoration: 'underline' }}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        {/* Submit button — Requirements: 11.7 */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? 'var(--amber-border)' : 'var(--amber)',
            color: 'var(--ink)',
            fontFamily: 'Lato, sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            letterSpacing: '0.02em',
          }}
        >
          {loading ? 'Creating account…' : 'Continue →'}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '28px 0 20px',
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            color: 'var(--muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          or sign up with
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Social buttons — Requirements: 2.2 — all disabled / coming soon */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Phone', icon: '📱' },
          { label: 'Google', icon: 'G' },
          { label: 'Apple', icon: '' },
        ].map(({ label, icon }) => (
          <button
            key={label}
            type="button"
            disabled
            aria-disabled="true"
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--muted2)',
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.875rem',
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: 0.5,
            }}
          >
            <span style={{ fontSize: label === 'Google' ? '0.875rem' : '1rem', fontWeight: label === 'Google' ? 700 : 400 }}>
              {icon}
            </span>
            <span>{label}</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.65rem',
                color: 'var(--muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginLeft: 4,
              }}
            >
              coming soon
            </span>
          </button>
        ))}
      </div>

      {/* Sign-in link */}
      <p
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: '0.875rem',
          color: 'var(--muted)',
          textAlign: 'center',
          marginTop: 28,
        }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: 700 }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
