'use client'

// StepBirthday — optional step after consent, before success.
// Collects birthday day + month (required for birthday promos) and optional year.
// Skipping is always allowed — customer just won't receive birthday promos.

import { useState } from 'react'
import { Cake, AlertCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BirthdayData {
  month: number    // 1–12
  day: number      // 1–31
  year: number | null
}

export interface StepBirthdayProps {
  userId: string
  onSaved: (data: BirthdayData) => void
  onSkip: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function daysInMonth(month: number): number {
  // Use a non-leap year for simplicity; day 29/30/31 validated server-side
  return new Date(2001, month, 0).getDate()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepBirthday({ userId, onSaved, onSkip }: StepBirthdayProps) {
  const [month, setMonth] = useState<string>('')
  const [day, setDay] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedMonth = parseInt(month, 10)
  const maxDays = selectedMonth > 0 ? daysInMonth(selectedMonth) : 31

  const canSave = month !== '' && day !== ''

  async function handleSave() {
    if (!canSave) return
    const m = parseInt(month, 10)
    const d = parseInt(day, 10)
    const y = year.trim() !== '' ? parseInt(year, 10) : null

    if (isNaN(m) || m < 1 || m > 12) { setError('Please pick a valid month.'); return }
    if (isNaN(d) || d < 1 || d > maxDays) { setError(`Please pick a valid day for ${MONTHS[m - 1]}.`); return }
    if (y !== null && (isNaN(y) || y < 1900 || y > new Date().getFullYear())) {
      setError('Please enter a valid year, or leave it blank.'); return
    }

    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          birthday_month: m,
          birthday_day: d,
          birthday_year: y,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save birthday.')
      }
      onSaved({ month: m, day: d, year: y })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
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

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: 'var(--ink)',
    border: '1px solid var(--amber-border)',
    borderRadius: 8,
    color: 'var(--cream)',
    fontFamily: 'Lato, sans-serif',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none' as any,
    cursor: 'pointer',
  }

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    cursor: 'text',
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Icon */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'rgba(255,163,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Cake size={28} style={{ color: 'var(--amber)' }} />
        </div>
      </div>

      {/* Heading */}
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '2rem',
        fontWeight: 600,
        color: 'var(--cream)',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        When's your birthday?
      </h1>
      <p style={{
        fontFamily: 'Lato, sans-serif',
        fontSize: '0.875rem',
        color: 'var(--muted)',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 1.5,
      }}>
        Venues you love will surprise you on your special day.
        Year is optional — we only need day and month.
      </p>

      {/* Month */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Month</label>
        <div style={{ position: 'relative' }}>
          <select
            value={month}
            onChange={(e) => { setMonth(e.target.value); setDay(''); setError(null) }}
            style={selectStyle}
          >
            <option value="">Select month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--muted)', fontSize: 12,
          }}>▼</span>
        </div>
      </div>

      {/* Day */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Day</label>
        <div style={{ position: 'relative' }}>
          <select
            value={day}
            onChange={(e) => { setDay(e.target.value); setError(null) }}
            disabled={!month}
            style={{ ...selectStyle, opacity: !month ? 0.4 : 1 }}
          >
            <option value="">Select day</option>
            {Array.from({ length: maxDays }, (_, i) => i + 1).map(d => (
              <option key={d} value={String(d)}>{d}</option>
            ))}
          </select>
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--muted)', fontSize: 12,
          }}>▼</span>
        </div>
      </div>

      {/* Year — optional */}
      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>
          Year <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.7rem', color: 'var(--muted)' }}>(optional)</span>
        </label>
        <input
          type="number"
          min={1900}
          max={new Date().getFullYear()}
          value={year}
          onChange={(e) => { setYear(e.target.value); setError(null) }}
          placeholder={`e.g. ${new Date().getFullYear() - 25}`}
          style={inputStyle}
        />
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
          We never share your age. Used only for age-gated offers.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '10px 12px', borderRadius: 8,
          border: '1px solid var(--danger)',
          background: 'rgba(220,38,38,0.08)',
        }}>
          <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8125rem', color: 'var(--danger)' }}>
            {error}
          </span>
        </div>
      )}

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || saving}
        style={{
          width: '100%',
          padding: '14px',
          background: canSave && !saving ? 'var(--amber)' : 'var(--amber-soft)',
          color: 'var(--ink)',
          fontFamily: 'Lato, sans-serif',
          fontSize: '1rem',
          fontWeight: 700,
          border: 'none',
          borderRadius: 8,
          cursor: canSave && !saving ? 'pointer' : 'not-allowed',
          marginBottom: 12,
          opacity: canSave && !saving ? 1 : 0.6,
          transition: 'opacity 0.15s',
        }}
      >
        {saving ? 'Saving…' : 'Save my birthday →'}
      </button>

      {/* Skip */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          style={{
            background: 'none', border: 'none',
            color: 'var(--muted)',
            fontFamily: 'Lato, sans-serif',
            fontSize: '0.8rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            padding: '4px 8px',
            opacity: saving ? 0.5 : 1,
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
