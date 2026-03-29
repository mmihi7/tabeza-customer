// Requirements: 11.6 — used by SignupWizard only
interface StepDotsProps {
  /** Total number of steps */
  total: number
  /** Current step index (0-indexed) */
  current: number
}

export default function StepDots({ total, current }: StepDotsProps) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        let bg: string
        if (i === current) {
          bg = 'var(--amber)'
        } else if (i < current) {
          bg = 'var(--amber-border)'
        } else {
          bg = 'var(--muted2)'
        }
        return (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: bg,
              display: 'inline-block',
              transition: 'background 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}
