// app/start/StepTabOpen.tsx
// Spec: Returning user step 4 - tab open success screen
'use client'

interface StepTabOpenProps {
  venueName: string
  venueMeta: string
  tabId: string
  identityLabel: string
  badgeLabel: string
  badgeColor: string
  onViewMenu: () => void
}

export default function StepTabOpen({
  venueName,
  venueMeta,
  tabId,
  identityLabel,
  badgeLabel,
  badgeColor,
  onViewMenu,
}: StepTabOpenProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.25rem 2.5rem',
        textAlign: 'center',
      }}
    >
      {/* Success icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#EAF3DE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '2rem',
          marginBottom: '1rem',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h1
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1.75rem',
          fontWeight: 600,
          color: 'var(--cream)',
          marginBottom: '0.375rem',
        }}
      >
        Tab is open
      </h1>
      <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
        {venueName} &middot; {venueMeta}
      </p>

      {/* Tab summary card */}
      <div
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          textAlign: 'left',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { label: 'Tab ID',       value: `#TAB-${tabId.slice(-5).toUpperCase()}` },
          { label: 'Venue',        value: venueName },
          { label: 'Appearing as', value: identityLabel },
          { label: 'Spend tier',   value: badgeLabel, color: badgeColor },
          { label: 'Payment',      value: 'M-Pesa on close' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}
          >
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8125rem', color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8125rem', fontWeight: 500, color: color ?? 'var(--cream)' }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={onViewMenu}
        style={{
          background: 'var(--amber)',
          color: 'var(--ink)',
          fontFamily: "'Lato', sans-serif",
          fontWeight: 700,
          fontSize: '1rem',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '1rem',
          width: '100%',
          cursor: 'pointer',
        }}
      >
        View menu
      </button>
    </div>
  )
}
