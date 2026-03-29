'use client'

import { useEffect, useRef, useState } from 'react'
import { Mail, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Helper (exported for tests) ─────────────────────────────────────────────

/**
 * Returns true only if the session has a confirmed email.
 * Requirements: 4.5
 * Property 7: Verify step cannot be bypassed without email confirmation
 */
export function canAdvanceFromVerify(
  session: { user?: { email_confirmed_at?: string | null } } | null
): boolean {
  return Boolean(session?.user?.email_confirmed_at)
}

// ─── Email masking ────────────────────────────────────────────────────────────

/**
 * Masks everything before @ except the first character.
 * e.g. "jane@example.com" → "j***@example.com"
 */
function maskEmail(email: string): string {
  const atIndex = email.indexOf('@')
  if (atIndex <= 1) return email // nothing to mask
  return email[0] + '***' + email.slice(atIndex)
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StepVerifyProps {
  email: string
  onVerified: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepVerify({ email, onVerified }: StepVerifyProps) {
  const [resendSent, setResendSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  // Keep a stable ref to onVerified so interval/listener closures don't go stale
  const onVerifiedRef = useRef(onVerified)
  useEffect(() => {
    onVerifiedRef.current = onVerified
  }, [onVerified])

  // ── Poll + auth state listener ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    // Poll every 3 seconds — Requirements: 4.4
    const intervalId = setInterval(async () => {
      if (cancelled) return
      const { data } = await supabase.auth.getSession()
      if (canAdvanceFromVerify(data.session)) {
        clearInterval(intervalId)
        if (!cancelled) onVerifiedRef.current()
      }
    }, 3000)

    // Also listen via onAuthStateChange — Requirements: 4.4 (event-based)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return
        if (
          (event === 'SIGNED_IN' || event === 'USER_UPDATED') &&
          canAdvanceFromVerify(session)
        ) {
          clearInterval(intervalId)
          onVerifiedRef.current()
        }
      }
    )

    // Cleanup on unmount — Requirements: 4.4 (clean up)
    return () => {
      cancelled = true
      clearInterval(intervalId)
      subscription.unsubscribe()
    }
  }, []) // intentionally empty — runs once on mount

  // ── Resend handler ──────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendLoading || resendSent) return
    setResendLoading(true)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setResendSent(true)
      // Reset confirmation after 5 seconds — Requirements: task spec
      setTimeout(() => setResendSent(false), 5000)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      {/* Icon */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: '1px solid var(--amber-border)',
          marginBottom: 24,
        }}
      >
        <Mail size={28} color="var(--amber)" />
      </div>

      {/* Heading — Requirements: 4.1 */}
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2rem',
          fontWeight: 600,
          color: 'var(--cream)',
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        Check your inbox
      </h1>

      {/* Confirmation message — Requirements: 4.1 */}
      <p
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: '0.9375rem',
          color: 'var(--muted)',
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        We&apos;ve sent a verification link to your email
      </p>

      {/* Masked email — Requirements: 4.2 */}
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '1rem',
          color: 'var(--amber)',
          marginBottom: 32,
          letterSpacing: '0.04em',
        }}
      >
        {maskEmail(email)}
      </p>

      {/* Resend button — Requirements: 4.3 */}
      <button
        type="button"
        onClick={handleResend}
        disabled={resendLoading || resendSent}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px 24px',
          background: 'transparent',
          border: '1px solid var(--amber)',
          borderRadius: 8,
          color: 'var(--amber)',
          fontFamily: 'Lato, sans-serif',
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: resendLoading || resendSent ? 'not-allowed' : 'pointer',
          opacity: resendLoading ? 0.6 : 1,
          transition: 'opacity 0.15s',
          letterSpacing: '0.02em',
        }}
      >
        <RefreshCw size={16} style={{ opacity: resendLoading ? 0.6 : 1 }} />
        {resendLoading ? 'Sending…' : 'Resend email'}
      </button>

      {/* Resend confirmation — Requirements: task spec */}
      {resendSent && (
        <p
          role="status"
          style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--amber)',
            marginTop: 12,
          }}
        >
          Resend sent ✓
        </p>
      )}

      {/* Waiting hint */}
      <p
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: '0.8125rem',
          color: 'var(--muted)',
          marginTop: 32,
          lineHeight: 1.5,
        }}
      >
        This page will advance automatically once your email is confirmed.
      </p>
    </div>
  )
}
