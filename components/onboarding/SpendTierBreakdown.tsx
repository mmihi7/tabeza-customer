// Requirements: 9.2, 11.1–11.10
interface SpendTierBreakdownProps {
  currentTier: 'bronze' | 'silver' | 'gold'
}

const TIERS = [
  { key: 'bronze' as const, label: 'Bronze', threshold: 'up to KES 3,000/wk' },
  { key: 'silver' as const, label: 'Silver', threshold: 'KES 3,001–5,000/wk' },
  { key: 'gold'   as const, label: 'Gold',   threshold: 'KES 5,001+/wk' },
]

export default function SpendTierBreakdown({ currentTier }: SpendTierBreakdownProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.5rem',
        background: 'var(--ink)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        border: '1px solid var(--border)',
      }}
    >
      {TIERS.map(({ key, label, threshold }) => {
        const isActive = key === currentTier
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 0.25rem',
              borderRadius: '0.375rem',
              background: isActive ? 'var(--amber)' : 'transparent',
              border: isActive ? '1px solid var(--amber)' : '1px solid transparent',
            }}
          >
            <span
              className={isActive ? undefined : `badge-${key}`}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderRadius: '0.25rem',
                padding: '0.125rem 0.375rem',
                display: 'inline-block',
                color: isActive ? 'var(--ink)' : undefined,
                background: isActive ? 'transparent' : undefined,
                border: isActive ? 'none' : undefined,
                fontWeight: isActive ? 700 : undefined,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.6rem',
                color: isActive ? 'var(--ink)' : 'var(--muted)',
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              {threshold}
            </span>
            {isActive && (
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.55rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                  marginTop: '0.125rem',
                }}
              >
                You are here
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
