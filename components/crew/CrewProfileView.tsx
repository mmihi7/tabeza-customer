'use client'

import { useState, useEffect } from 'react'
import { Star, X, Loader, MapPin, Award, TrendingUp, Heart, Briefcase } from 'lucide-react'

interface CrewProfileProps {
  isOpen: boolean
  onClose: () => void
  crewId: string
}

export default function CrewProfileView({ isOpen, onClose, crewId }: CrewProfileProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && crewId) {
      fetchProfile()
    }
  }, [isOpen, crewId])

  async function fetchProfile() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/crew/profile/${crewId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile')
      }

      setProfile(data.profile)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  function getBadgeLabel(tier: string) {
    switch (tier) {
      case 'gold': return '🥇 Gold'
      case 'silver': return '🥈 Silver'
      default: return 'Standard'
    }
  }

  function getBadgeColor(tier: string) {
    switch (tier) {
      case 'gold': return { bg: 'rgba(255,79,0,0.15)', border: 'rgba(255,79,0,0.3)', color: 'var(--amber)' }
      case 'silver': return { bg: 'rgba(192,192,192,0.15)', border: 'rgba(192,192,192,0.3)', color: '#c0c0c0' }
      default: return { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)', color: 'var(--muted)' }
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--ink)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        width: '100%',
        maxWidth: 400,
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'var(--ink)',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--cream)' }}>
            Crew Profile
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader size={20} style={{ color: 'var(--amber)', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{
              padding: '1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '0.75rem',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{error}</p>
            </div>
          ) : profile ? (
            <>
              {/* Profile Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, rgba(134,239,172,0.3), rgba(16,185,129,0.15))',
                  border: '3px solid rgba(134,239,172,0.3)',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {profile.half_body_photo_url || profile.face_photo_url ? (
                    <img
                      src={profile.half_body_photo_url || profile.face_photo_url}
                      alt={profile.display_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Briefcase size={40} style={{ color: 'rgba(134,239,172,0.6)' }} />
                  )}
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.5rem' }}>
                  {profile.display_name}
                </h2>

                {/* Badge */}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '999px',
                  background: getBadgeColor(profile.badge_tier).bg,
                  border: `1px solid ${getBadgeColor(profile.badge_tier).border}`,
                  color: getBadgeColor(profile.badge_tier).color,
                }}>
                  {getBadgeLabel(profile.badge_tier)}
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.8)',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}>
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <Star size={14} style={{ color: 'var(--amber)', fill: 'var(--amber)' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)' }}>
                      {profile.average_rating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                    {profile.total_ratings || 0} ratings
                  </span>
                </div>

                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <TrendingUp size={14} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)' }}>
                      {profile.performance_score || 0}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                    Performance
                  </span>
                </div>

                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <Award size={14} style={{ color: 'var(--info)' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)' }}>
                      {profile.total_shifts_completed || 0}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                    Shifts
                  </span>
                </div>

                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <Heart size={14} style={{ color: 'var(--danger)' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)' }}>
                      {profile.total_likes || 0}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                    Likes
                  </span>
                </div>
              </div>

              {/* Preferred Locations */}
              {profile.preferred_locations && profile.preferred_locations.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    <MapPin size={14} style={{ color: 'var(--muted)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Preferred Areas
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {profile.preferred_locations.map((loc: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid var(--border)',
                          color: 'var(--cream)',
                        }}
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Roles */}
              {profile.preferred_roles && profile.preferred_roles.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    <Briefcase size={14} style={{ color: 'var(--muted)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Skills
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {profile.preferred_roles.map((role: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '999px',
                          background: 'rgba(255,79,0,0.1)',
                          border: '1px solid rgba(255,79,0,0.2)',
                          color: 'var(--amber)',
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Ratings */}
              {profile.recent_ratings && profile.recent_ratings.length > 0 && (
                <div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}>
                    Recent Reviews
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {profile.recent_ratings.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              style={{
                                color: i < r.rating ? 'var(--amber)' : 'var(--border)',
                                fill: i < r.rating ? 'var(--amber)' : 'transparent',
                              }}
                            />
                          ))}
                          <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                            {new Date(r.created_at).toLocaleDateString('en-KE')}
                          </span>
                        </div>
                        {r.comment && (
                          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>
                            {r.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
