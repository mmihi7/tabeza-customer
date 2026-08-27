'use client'

import { Star, User } from 'lucide-react'

export interface CrewMember {
  id: string
  display_name: string
  face_photo_url?: string
  face_thumbnail_url?: string
  badge_tier?: 'standard' | 'silver' | 'gold'
  performance_score?: number
  total_shifts_completed?: number
  average_rating?: number
}

interface CrewAvatarProps {
  crew: CrewMember | null
  onRate?: () => void
  onTip?: () => void
  showActions?: boolean
}

const BADGE_LABEL = {
  standard: 'Standard',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
}

const BADGE_COLOR = {
  standard: { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)', color: 'var(--muted)' },
  silver: { bg: 'rgba(192,192,192,0.15)', border: 'rgba(192,192,192,0.3)', color: '#c0c0c0' },
  gold: { bg: 'rgba(255,79,0,0.15)', border: 'rgba(255,79,0,0.3)', color: 'var(--amber)' },
}

export default function CrewAvatar({ crew, onRate, onTip, showActions = false }: CrewAvatarProps) {
  if (!crew) return null

  const badgeTier = crew.badge_tier || 'standard'
  const bc = BADGE_COLOR[badgeTier]
  const photoUrl = crew.face_thumbnail_url || crew.face_photo_url

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      {/* Avatar */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, rgba(134,239,172,0.3), rgba(16,185,129,0.15))',
        boxShadow: '0 4px 16px rgba(16,185,129,0.25), 0 1px 3px rgba(0,0,0,0.2)',
        border: '3px solid rgba(134,239,172,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={crew.display_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <User size={28} style={{ color: 'rgba(134,239,172,0.6)' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.125rem' }}>
          Your waiter
        </p>
        <p style={{ 
          fontSize: '0.9375rem', 
          fontWeight: 600, 
          color: 'white',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {crew.display_name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          {/* Badge */}
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: '999px',
            background: bc.bg,
            border: `1px solid ${bc.border}`,
            color: bc.color,
          }}>
            {BADGE_LABEL[badgeTier]}
          </span>
          {/* Rating */}
          {crew.average_rating && crew.average_rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Star size={10} style={{ color: 'var(--amber)', fill: 'var(--amber)' }} />
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.8)' }}>
                {crew.average_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {onRate && (
            <button
              onClick={onRate}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Rate
            </button>
          )}
          {onTip && (
            <button
              onClick={onTip}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'var(--amber)',
                border: 'none',
                color: '#1a1a2e',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Tip
            </button>
          )}
        </div>
      )}
    </div>
  )
}
