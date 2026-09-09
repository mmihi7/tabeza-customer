'use client'

import { Heart, Star, User } from 'lucide-react'

export interface CrewMember {
  id: string
  display_name: string
  face_photo_url?: string
  face_thumbnail_url?: string
  badge_tier?: 'standard' | 'silver' | 'gold'
  performance_score?: number
  total_shifts_completed?: number
  average_rating?: number
  total_ratings?: number
  total_likes?: number
}

interface CrewAvatarProps {
  crew: CrewMember | null
  onOpenProfile?: () => void
  onRate?: () => void
}

export default function CrewAvatar({ crew, onOpenProfile, onRate }: CrewAvatarProps) {
  if (!crew) return null

  const photoUrl = crew.face_thumbnail_url || crew.face_photo_url
  // Stars under the name reflect the crew member's like count (clipped to 5).
  // Likes are the customer-facing rating currency — a heart is a rating.
  const likeCount = crew.total_likes ?? 0
  const fillCount = Math.min(5, likeCount)

  const content = (
    <>
      {/* Avatar */}
      <div style={{
        width: 56,
        height: 56,
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
          <User size={26} style={{ color: 'rgba(134,239,172,0.6)' }} />
        )}
      </div>

      {/* Name */}
      <div style={{ minWidth: 0 }}>
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
        {onRate ? (
          <div
            role="button"
            onClick={(e) => { e.stopPropagation(); onRate(); }}
            title={likeCount > 0 ? `Rate ${crew.display_name}` : `Rate ${crew.display_name} — be the first to rate`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.1875rem',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={12}
                  style={{
                    color: n <= fillCount ? '#FFB300' : 'rgba(255,255,255,0.22)',
                    fill: n <= fillCount ? '#FFB300' : 'transparent',
                  }}
                />
              ))}
            </span>
            {likeCount > 0 && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)',
              }}>
                <Heart size={10} style={{ color: '#f87171', fill: '#f87171' }} />
                {likeCount}
              </span>
            )}
          </div>
        ) : (
          crew.total_likes != null && crew.total_likes > 0 && (
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
              <Heart size={10} style={{ color: '#f87171', fill: '#f87171' }} />
              {crew.total_likes}
            </p>
          )
        )}
      </div>
    </>
  )

  if (onOpenProfile) {
    return (
      <button
        onClick={onOpenProfile}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        title="View waiter profile"
      >
        {content}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {content}
    </div>
  )
}
