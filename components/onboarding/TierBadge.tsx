// Requirements: 7.2, 7.3, 11.10
interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold'
}

export default function TierBadge({ tier }: TierBadgeProps) {
  return (
    <span
      className={`badge-${tier}`}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.65rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderRadius: '0.25rem',
        padding: '0.125rem 0.5rem',
        display: 'inline-block',
      }}
    >
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  )
}
