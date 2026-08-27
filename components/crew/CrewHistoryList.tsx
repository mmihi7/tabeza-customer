'use client'

import { useState, useEffect } from 'react'
import { Star, MapPin, Loader, User } from 'lucide-react'

interface CrewInteraction {
  type: 'rating' | 'tip'
  rating?: number
  comment?: string
  amount?: number
  venue?: { id: string; name: string; location?: string }
  date: string
}

interface CrewHistoryItem {
  crew_member: {
    id: string
    display_name: string
    face_photo_url?: string
    face_thumbnail_url?: string
    badge_tier?: string
    performance_score?: number
    total_shifts_completed?: number
  }
  interactions: CrewInteraction[]
  total_ratings: number
  total_tips: number
  avg_rating: number
}

export default function CrewHistoryList() {
  const [history, setHistory] = useState<CrewHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/crew/history')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load history')
      }

      setHistory(data.history || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <Loader size={20} style={{ color: 'var(--amber)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '0.75rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{error}</p>
        <button
          onClick={fetchHistory}
          style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--amber)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <User size={40} style={{ color: 'var(--muted)', opacity: 0.5, marginBottom: '1rem' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          No crew interactions yet
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', opacity: 0.7 }}>
          Crew you serve with will appear here
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {history.map((item) => (
        <div
          key={item.crew_member.id}
          style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
          }}
        >
          {/* Crew Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, rgba(134,239,172,0.3), rgba(16,185,129,0.15))',
              border: '2px solid rgba(134,239,172,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {item.crew_member.face_thumbnail_url || item.crew_member.face_photo_url ? (
                <img
                  src={item.crew_member.face_thumbnail_url || item.crew_member.face_photo_url}
                  alt={item.crew_member.display_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={20} style={{ color: 'rgba(134,239,172,0.6)' }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cream)' }}>
                {item.crew_member.display_name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                {item.avg_rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={10} style={{ color: 'var(--amber)', fill: 'var(--amber)' }} />
                    <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.8)' }}>
                      {item.avg_rating.toFixed(1)}
                    </span>
                  </div>
                )}
                <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                  {item.total_ratings} rating{item.total_ratings !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Interactions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {item.interactions.slice(0, 3).map((interaction, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {interaction.type === 'rating' ? (
                    <>
                      <div style={{ display: 'flex', gap: '0.125rem' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            style={{
                              color: i < (interaction.rating || 0) ? 'var(--amber)' : 'var(--border)',
                              fill: i < (interaction.rating || 0) ? 'var(--amber)' : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {interaction.comment || 'No comment'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>
                        +KES {interaction.amount}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>tip</span>
                    </>
                  )}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                  {formatDate(interaction.date)}
                </span>
              </div>
            ))}
          </div>

          {/* Venue */}
          {item.interactions[0]?.venue && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border)',
            }}>
              <MapPin size={12} style={{ color: 'var(--muted)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {(item.interactions[0].venue as any)?.name}
                {(item.interactions[0].venue as any)?.location && ` · ${(item.interactions[0].venue as any)?.location}`}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
