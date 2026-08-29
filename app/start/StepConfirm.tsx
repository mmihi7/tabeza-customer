// app/start/StepConfirm.tsx
// Spec: Returning user step 3 - venue card + identity summary
'use client'

interface StepConfirmProps {
  venueName: string
  venueMeta: string        // e.g. "Table 7 - Nairobi CBD"
  identityLabel: string    // "Amara W." | "The Phantom" | "Anonymous"
  onConfirm: () => void
  onBack: () => void
  onChangeIdentity: () => void
  creating: boolean
}

export default function StepConfirm({
  venueName,
  venueMeta,
  identityLabel,
  onConfirm,
  onBack,
  onChangeIdentity,
  creating,
}: StepConfirmProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.25rem 2.5rem',
      }}
    >
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1.75rem',
          fontWeight: 600,
          color: 'var(--cream)',
          marginBottom: '1.25rem',
        }}
      >
        Connecting to
      </h1>

      {/* Venue card */}
      <div
        style={{
          border: '1px solid var(--amber-border)',
          borderRadius: '0.5rem',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '0.375rem',
            background: 'var(--amber-pale)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: 'var(--cream)', marginBottom: '0.125rem' }}>
            {venueName}
          </p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8125rem', color: 'var(--muted)' }}>
            {venueMeta}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: '1rem' }} />

      {/* Identity summary */}
      <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
        Appearing as:{' '}
        <strong style={{ color: 'var(--cream)' }}>{identityLabel}</strong>
        {' \u00b7 '}
        <button
          onClick={onChangeIdentity}
          style={{ background: 'none', border: 'none', color: 'var(--amber)', fontFamily: "'Lato', sans-serif", fontSize: '0.8125rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
        >
          change
        </button>
      </p>

      <div style={{ flex: 1 }} />

      {/* Open tab CTA */}
      <button
        onClick={onConfirm}
        disabled={creating}
        style={{
          background: creating ? 'var(--amber-soft)' : 'var(--amber)',
          color: 'var(--ink)',
          fontFamily: "'Lato', sans-serif",
          fontWeight: 700,
          fontSize: '1rem',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '1rem',
          width: '100%',
          cursor: creating ? 'not-allowed' : 'pointer',
          opacity: creating ? 0.8 : 1,
          marginBottom: '0.75rem',
        }}
      >
        {creating ? 'Opening tab...' : 'Open my tab'}
      </button>

      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          color: 'var(--muted)',
          fontFamily: "'Lato', sans-serif",
          fontWeight: 400,
          fontSize: '0.9375rem',
          border: '1.5px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          width: '100%',
          cursor: 'pointer',
        }}
      >
        Choose a different venue
      </button>
    </div>
  )
}