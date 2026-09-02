'use client'

import { User } from 'lucide-react'

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
  onOpenProfile?: () => void
}

export default function CrewAvatar({ crew, onOpenProfile }: CrewAvatarProps) {
  if (!crew) return null

  const photoUrl = crew.face_thumbnail_url || crew.face_photo_url

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
