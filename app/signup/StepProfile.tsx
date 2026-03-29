'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates the Profile step data.
 * Exported for use in property-based tests (task 3.5).
 * Requirements: 3.4
 */
export function validateProfileStep(data: { firstName: string }): {
  valid: boolean
  errors: { firstName?: string }
} {
  if (!data.firstName || data.firstName.trim() === '') {
    return { valid: false, errors: { firstName: 'First name is required.' } }
  }
  return { valid: true, errors: {} }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StepProfileProps {
  firstName: string
  lastName: string
  mobile: string
  onFirstNameChange: (v: string) => void
  onLastNameChange: (v: string) => void
  onMobileChange: (v: string) => void
  onNext: () => void
  onBack: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepProfile({
  firstName,
  lastName,
  mobile,
  onFirstNameChange,
  onLastNameChange,
  onMobileChange,
  onNext,
  onBack,
}: StepProfileProps) {
  const [errors, setErrors] = useState<{ firstName?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validateProfileStep({ firstName })
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    onNext()
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Lato, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--cream)',
    marginBottom: 6,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: 'var(--ink)',
    border: '1px solid var(--amber-border)',
    borderRadius: 8,
    color: 'var(--cream)',
    fontFamily: 'Lato, sans-serif',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
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
        Tell us about yourself
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
        Personalise your Tabeza experience
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* First name — required */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="profile-first-name" style={labelStyle}>
            First name *
          </label>
          <input
            id="profile-first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => {
              onFirstNameChange(e.target.value)
              // Clear error on change
              if (errors.firstName) setErrors({})
            }}
            placeholder="Your first name"
            style={{
              ...inputStyle,
              borderColor: errors.firstName ? 'var(--danger)' : 'var(--amber-border)',
            }}
            onFocus={(e) => {
              if (!errors.firstName) e.currentTarget.style.borderColor = 'var(--amber)'
            }}
            onBlur={(e) => {
              if (!errors.firstName) e.currentTarget.style.borderColor = 'var(--amber-border)'
            }}
          />
          {/* Inline validation error — Requirements: 3.4 */}
          {errors.firstName && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
              }}
            >
              <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '0.8rem',
                  color: 'var(--danger)',
                }}
              >
                {errors.firstName}
              </span>
            </div>
          )}
        </div>

        {/* Last name — optional */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="profile-last-name" style={labelStyle}>
            Last name (optional)
          </label>
          <input
            id="profile-last-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Your last name"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--amber-border)')}
          />
        </div>

        {/* Mobile — optional, M-Pesa hint */}
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="profile-mobile" style={labelStyle}>
            Mobile (optional)
          </label>
          <input
            id="profile-mobile"
            type="tel"
            autoComplete="tel"
            value={mobile}
            onChange={(e) => onMobileChange(e.target.value)}
            placeholder="+254 7XX XXX XXX"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--amber-border)')}
          />
          <p
            style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.75rem',
              color: 'var(--muted)',
              marginTop: 4,
            }}
          >
            Used for M-Pesa payments
          </p>
        </div>

        {/* Continue button — Requirements: 11.7 */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--amber)',
            color: 'var(--ink)',
            fontFamily: 'Lato, sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.15s',
            letterSpacing: '0.02em',
            marginBottom: 12,
          }}
        >
          Continue →
        </button>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: 'var(--muted)',
            fontFamily: 'Lato, sans-serif',
            fontSize: '0.875rem',
            fontWeight: 400,
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          Back
        </button>
      </form>
    </div>
  )
}
