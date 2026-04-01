// app/start/StepConfirm.tsx
// Spec: Returning user step 3 - venue card + spend tier matrix + identity summary
'use client'

interface SpendTier {
  label: string
  here: boolean
}

interface StepConfirmProps {
  venueName: string
  venueMeta: string        // e.g. "Table 7 - Nairobi CBD"
  badgeLabel: string       // e.g. "Bronze" | "Silver" | "Gold" | "New"
  spendTiers: SpendTier[]  // 3 tiers with which one is "here"
  tierDescription: string
  weeklyVisits: number     // 0-3 for visit dots
  identityLabel: string    // "Amara W." | "The Phantom" | "Anonymous"
  onConfirm: () => void
  onBack: () => void
  onChangeIdentity: () => void
  creating: boolean
}

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  Bronze: { bg: '#FAEEDA', text: '#633806' },
  Silver: { bg: '#F0F0F0', text: '#444444' },
  Gold:   { bg: '#EEEDFE', text: '#3C3489' },
  New:    { bg: '#F5F5F5', text: '#888888' },
}

export default function StepConfirm({
  venueName,
  venueMeta,
  badgeLabel,
  spendTiers,
  tierDescription,
  weeklyVisits,
  identityLabel,
  onConfirm,
  onBack,
  onChangeIdentity,
  creating,
}: StepConfirmProps) {
  const badgeColor = TIER_COLORS[badgeLabel] ?? TIER_COLORS.New

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
        <span
          style={{
            background: badgeColor.bg,
            color: badgeColor.text,
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderRadius: '0.25rem',
            padding: '0.2rem 0.6rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: '1rem' }} />

      {/* Spend tier matrix */}
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.625rem' }}>
        Spend tiers at this venue
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
        {spendTiers.map((t) => (
          <div
            key={t.label}
            style={{
              flex: 1,
              padding: '0.5rem 0.25rem',
              borderRadius: '0.375rem',
              textAlign: 'center',
              background: t.here ? 'var(--amber-pale)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${t.here ? 'var(--amber-border)' : 'transparent'}`,
            }}
          >
            <span style={{ display: 'block', fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: t.here ? 'var(--amber)' : 'var(--muted)' }}>
              {t.label}
            </span>
            <span style={{ display: 'block', fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', color: t.here ? 'var(--amber)' : 'var(--muted2)', marginTop: '0.125rem' }}>
              {t.here ? 'You are here' : ''}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.875rem' }}>
        {tierDescription}
      </p>

      {/* Visit dots */}
      {weeklyVisits > 0 && (
        <>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>
            Visit frequency this week
          </p>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '1rem' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: i < weeklyVisits ? 'var(--amber)' : 'var(--muted2)',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: '0.875rem' }} />

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
