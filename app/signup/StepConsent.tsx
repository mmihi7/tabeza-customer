'use client'

// Requirements: 5.1–5.11, 12.1–12.3, 11.1–11.8

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import PrivacyPromiseStrip from '@/components/onboarding/PrivacyPromiseStrip'
import { persistConsentRecord, APP_VERSION } from '@/lib/consent-records'

// ─── Data categories ──────────────────────────────────────────────────────────
// Requirements: 5.3, 5.10 — plain-language benefit descriptions; no forbidden words

const DATA_CATEGORIES = [
  {
    id: 'visits',
    title: 'Visits',
    description:
      "We remember which venues you've been to, so you get a warm welcome every time you return.",
  },
  {
    id: 'spend',
    title: 'Spend',
    description:
      'We use your spend history to give you better prices at the venues you love.',
  },
  {
    id: 'orders',
    title: 'Orders & Payments',
    description:
      'We keep a record of your orders so you never have to repeat yourself.',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StepConsentProps {
  userId: string
  onDecision: (decision: 'agreed' | 'skipped') => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepConsent({ userId, onDecision }: StepConsentProps) {
  const [loading, setLoading] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  // ── "I agree" handler — Requirements: 5.8, 12.1–12.3 ──────────────────────
  async function handleAgree() {
    setDbError(null)
    setLoading(true)
    try {
      await persistConsentRecord({ userId, decision: 'agreed', appVersion: APP_VERSION })
      onDecision('agreed')
    } catch (err: unknown) {
      console.error('Consent persist error:', err)
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setDbError(message)
    } finally {
      setLoading(false)
    }
  }

  // ── "Not now" handler — Requirements: 5.9, best-effort ────────────────────
  async function handleSkip() {
    // Best-effort: advance even if DB call fails
    try {
      await persistConsentRecord({ userId, decision: 'skipped', appVersion: APP_VERSION })
    } catch (err) {
      console.error('Consent skip persist error (best-effort):', err)
    }
    onDecision('skipped')
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Heading — Requirements: 11.5 Cormorant Garamond */}
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
        Your data, your way
      </h1>
      <p
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: '0.875rem',
          color: 'var(--muted)',
          textAlign: 'center',
          marginBottom: 28,
        }}
      >
        Here's what we use to personalise your experience.
      </p>

      {/* Data categories — Requirements: 5.3, 11.2, 11.4 */}
      <div style={{ marginBottom: 24 }}>
        {DATA_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            style={{
              borderLeft: '3px solid var(--amber-border)',
              paddingLeft: 14,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--cream)',
                marginBottom: 2,
              }}
            >
              {cat.title}
            </p>
            <p
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.8125rem',
                color: 'var(--muted)',
                lineHeight: 1.5,
              }}
            >
              {cat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Privacy Promise Strip — Requirements: 5.4, 11.8 */}
      <div style={{ marginBottom: 20 }}>
        <PrivacyPromiseStrip />
      </div>

      {/* Legal links — Requirements: 5.5 */}
      <p
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: '0.8rem',
          color: 'var(--muted)',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        By continuing you agree to our{' '}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--amber)', textDecoration: 'underline' }}
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--amber)', textDecoration: 'underline' }}
        >
          Privacy Policy
        </Link>
        .
      </p>

      {/* Inline DB error — Requirements: 12.3 */}
      {dbError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: 16,
            padding: '10px 12px',
            border: '1px solid var(--danger)',
            borderRadius: 8,
            background: 'rgba(var(--danger-rgb, 220, 38, 38), 0.08)',
          }}
        >
          <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
          <span
            style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.8125rem',
              color: 'var(--danger)',
              lineHeight: 1.4,
            }}
          >
            {dbError}
          </span>
        </div>
      )}

      {/* Primary CTA — Requirements: 5.6, 5.8, 11.2, 11.7 */}
      <button
        type="button"
        onClick={handleAgree}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? 'var(--amber-soft)' : 'var(--amber)',
          color: 'var(--ink)',
          fontFamily: 'Lato, sans-serif',
          fontSize: '1rem',
          fontWeight: 700,
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
          letterSpacing: '0.02em',
          marginBottom: 12,
          opacity: loading ? 0.8 : 1,
        }}
      >
        {loading ? 'Saving…' : 'I agree — let\'s go →'}
      </button>

      {/* Secondary CTA — Requirements: 5.7, 5.9, 5.11 — visually subordinate */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontFamily: 'Lato, sans-serif',
            fontSize: '0.8rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '4px 8px',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
