// Requirements: 7.3, 9.3
interface VisitFrequencyDotsProps {
  /** Number of visits in the past 7 days */
  visits: number
  /** Total dot slots to display */
  max: number
}

export default function VisitFrequencyDots({ visits, max }: VisitFrequencyDotsProps) {
  const filled = Math.min(visits, max)
  const empty = Math.max(0, max - filled)

  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      {Array.from({ length: filled }).map((_, i) => (
        <span
          key={`filled-${i}`}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--amber)',
            display: 'inline-block',
          }}
        />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span
          key={`empty-${i}`}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--muted2)',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  )
}
