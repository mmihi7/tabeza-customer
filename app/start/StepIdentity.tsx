// app/start/StepIdentity.tsx
// Requirements: 8.1–8.5, 11.1–11.7
'use client'

// ── Types ──────────────────────────────────────────────────────────────────

interface StepIdentityProps {
  venueName: string
  userName: string  // user's registered name (from user metadata)
  identityMode: 'named' | 'nickname' | 'anonymous'
  nickname: string
  onIdentityModeChange: (mode: 'named' | 'nickname' | 'anonymous') => void
  onNicknameChange: (v: string) => void
  onConfirm: () => void
  onBack: () => void
}

// ── Option config ──────────────────────────────────────────────────────────

const OPTIONS: Array<{
  mode: 'named' | 'nickname' | 'anonymous'
  label: string
}> = [
  { mode: 'named',     label: 'As yourself'     },
  { mode: 'nickname',  label: 'Use a nickname'   },
  { mode: 'anonymous', label: 'Stay anonymous'   },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function StepIdentity({
  venueName,
  userName,
  identityMode,
  nickname,
  onIdentityModeChange,
  onNicknameChange,
  onConfirm,
  onBack,
}: StepIdentityProps) {
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
      {/* ── Heading — Requirement 8.1 ──────────────────────────────────── */}
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1.75rem',
          fontWeight: 600,
          color: 'var(--cream)',
          lineHeight: 1.2,
          marginBottom: '0.375rem',
        }}
      >
        How do you want to appear?
      </h1>
      <p
        style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: '0.9375rem',
          color: 'var(--muted)',
          marginBottom: '2rem',
        }}
      >
        {venueName}
      </p>

      {/* ── Identity options — Requirement 8.2 ────────────────────────── */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}
        role="radiogroup"
        aria-label="Identity options"
      >
        {OPTIONS.map(({ mode, label }) => {
          const isSelected = identityMode === mode

          return (
            <div key={mode}>
              <button
                role="radio"
                aria-checked={isSelected}
                onClick={() => onIdentityModeChange(mode)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: isSelected ? 'var(--amber-pale)' : 'transparent',
                  border: `1.5px solid ${isSelected ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {/* Option label */}
                <span
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: 'var(--cream)',
                    display: 'block',
                    marginBottom: mode === 'named' && isSelected ? '0.25rem' : 0,
                  }}
                >
                  {label}
                </span>

                {/* Sub-label: show userName under "As yourself" — Requirement 8.2 */}
                {mode === 'named' && (
                  <span
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: '0.8125rem',
                      color: 'var(--muted)',
                      display: 'block',
                      marginTop: '0.2rem',
                    }}
                  >
                    {userName}
                  </span>
                )}
              </button>

              {/* Nickname input — Requirement 8.4: shown when "Use a nickname" is selected */}
              {mode === 'nickname' && isSelected && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => onNicknameChange(e.target.value)}
                    maxLength={30}
                    placeholder="Your nickname"
                    aria-label="Nickname"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1.5px solid var(--amber)',
                      borderRadius: '0.375rem',
                      padding: '0.625rem 0.875rem',
                      fontFamily: "'Lato', sans-serif",
                      fontSize: '0.9375rem',
                      color: 'var(--cream)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Anonymous warning — Requirement 8.3: shown when "Stay anonymous" is selected */}
              {mode === 'anonymous' && isSelected && (
                <p
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontStyle: 'italic',
                    fontSize: '0.8125rem',
                    color: 'var(--muted)',
                    marginTop: '0.5rem',
                    paddingLeft: '0.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  Anonymous visits don&apos;t count toward your loyalty tier.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ── Confirm button — Requirement 8.5 ──────────────────────────── */}
      <button
        onClick={onConfirm}
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
          letterSpacing: '0.01em',
          marginBottom: '0.75rem',
        }}
      >
        Confirm
      </button>

      {/* ── Back button ────────────────────────────────────────────────── */}
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
        Back
      </button>
    </div>
  )
}
