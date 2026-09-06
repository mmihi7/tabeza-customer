'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, User, Star, Heart, ExternalLink, Users, Gift } from 'lucide-react'
import CrewRatingModal from './CrewRatingModal'
import CrewProfileView from './CrewProfileView'
import CrewTipButton from './CrewTipButton'
import type { CrewMember } from './CrewAvatar'

export interface VenueTeamMember {
  id: string
  role: string
  employment_type?: string
  display_name: string
  bio?: string | null
  face_photo_url?: string | null
  face_thumbnail_url?: string | null
  total_likes?: number
  total_shifts_completed?: number
  performance_score?: number | null
}

interface VenueCrewModalProps {
  isOpen: boolean
  onClose: () => void
  /** Current venue. Used to fetch the venue's crew roster. */
  barId?: string | null
  /** Venue display name for the sheet header. */
  venueName?: string
  /** The crew member currently assigned to this customer's tab. */
  assignedCrew?: CrewMember | null
  /** Tip a crew member — provided by the menu page (tab context). */
  onTip?: (crew: { id: string; display_name: string }, amount: number) => Promise<void>
  /** Rate/comment a crew member — provided by the menu page (tab context). */
  onRate?: (crew: { id: string; display_name: string }, rating: number, comment?: string) => Promise<void>
}

const ROLE_LABEL: Record<string, string> = {
  assigned: 'Your waiter',
  manager: 'Manager',
  chef: 'Chef',
  waiter: 'Waiter',
  bartender: 'Bartender',
  captain: 'Captain',
  host: 'Host',
}

const ROLE_COLOR: Record<string, string> = {
  assigned: '#22c55e',
  manager: '#FFB300',
  chef: '#f97316',
  waiter: '#22c55e',
  bartender: '#38bdf8',
  captain: '#a78bfa',
  host: '#f472b6',
}

export default function VenueCrewModal({
  isOpen,
  onClose,
  barId,
  venueName,
  assignedCrew,
  onTip,
  onRate,
}: VenueCrewModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [team, setTeam] = useState<VenueTeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<VenueTeamMember | null>(null)
  const [ratingCrew, setRatingCrew] = useState<VenueTeamMember | null>(null)
  const [profileCrewId, setProfileCrewId] = useState<string | null>(null)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setIsVisible(true))
      document.body.style.overflow = 'hidden'
      return () => {
        cancelAnimationFrame(raf)
        document.body.style.overflow = 'unset'
      }
    }
    setIsVisible(false)
  }, [isOpen])

  const assignedMember: VenueTeamMember | null = assignedCrew
    ? {
        id: assignedCrew.id,
        role: 'assigned',
        display_name: assignedCrew.display_name,
        face_photo_url: assignedCrew.face_photo_url,
        face_thumbnail_url: assignedCrew.face_thumbnail_url,
        total_likes: assignedCrew.total_likes,
        total_shifts_completed: assignedCrew.total_shifts_completed,
        performance_score: assignedCrew.performance_score,
      }
    : null

  const loadTeam = useCallback(async () => {
    if (!barId) {
      setTeam([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/venue/team/${encodeURIComponent(barId)}`)
      const data = await res.json().catch(() => ({ team: [] }))
      setTeam((data.team ?? []) as VenueTeamMember[])
    } catch {
      setTeam([])
    } finally {
      setLoading(false)
    }
  }, [barId])

  useEffect(() => {
    if (isOpen) loadTeam()
  }, [isOpen, loadTeam])

  // Build the display list: assigned waiter first, then the venue roster.
  const members = useCallback((): VenueTeamMember[] => {
    const list: VenueTeamMember[] = []
    if (assignedMember) {
      list.push({ ...assignedMember })
    }
    const seen = new Set(list.map((m) => m.id))
    for (const m of team) {
      if (!seen.has(m.id)) {
        seen.add(m.id)
        list.push(m)
      }
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, assignedMember?.id])

  useEffect(() => {
    if (isOpen) {
      const list = members()
      setSelected((prev) => prev && list.some((m) => m.id === prev.id) ? prev : (list[0] ?? null))
    }
  }, [isOpen, team]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) {
      setShowTip(false)
      setRatingCrew(null)
      setProfileCrewId(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const list = members()
  const hasAnyone = list.length > 0
  const sel = selected && list.some((m) => m.id === selected.id) ? selected : (list[0] ?? null)

  const roleColor = (m: VenueTeamMember) => ROLE_COLOR[m.role] || ROLE_COLOR.waiter

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '85dvh', overflowY: 'auto', background: 'var(--ink, #0c0c16)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '0.9rem', right: '1rem', zIndex: 2,
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--cream, #fff)',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: '0.25rem 1.25rem 1.75rem' }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Users size={18} style={{ color: 'var(--amber, #f59e0b)' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--cream, #fff)', margin: 0 }}>
              Our team
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {venueName || 'The people taking care of you'} — like, tip or review them for great service.
          </p>

          {loading && list.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '2rem 0', fontSize: '0.85rem' }}>
              Loading…
            </p>
          ) : !hasAnyone ? (
            <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 0.875rem',
                background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={28} style={{ color: 'rgba(255,255,255,0.35)' }} />
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--cream, #fff)', marginBottom: '0.25rem' }}>
                Meet the team, soon
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {venueName || 'This venue'} is setting up its crew. When your waiter, manager and
                kitchen join, they’ll appear here so you can thank them.
              </p>
            </div>
          ) : (
            <>
              {/* Bubbles */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1.25rem 0 0.5rem' }}>
                {list.map((m) => {
                  const photo = m.face_thumbnail_url || m.face_photo_url
                  const isSel = sel?.id === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setSelected(m); setShowTip(false) }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        width: 84, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}
                    >
                      <div style={{
                        width: 68, height: 68, borderRadius: '50%', overflow: 'hidden',
                        background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                        border: `3px solid ${isSel ? roleColor(m) : 'rgba(255,255,255,0.18)'}`,
                        boxShadow: isSel ? `0 4px 16px ${roleColor(m)}55` : '0 2px 8px rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {photo ? (
                          <img src={photo} alt={m.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={26} style={{ color: 'rgba(255,255,255,0.4)' }} />
                        )}
                      </div>
                      <span style={{
                        marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 600, color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                      }}>
                        {m.display_name}
                      </span>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                        color: roleColor(m), marginTop: '0.1rem',
                      }}>
                        {ROLE_LABEL[m.role] || m.role}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Selected detail + actions */}
              {sel && (
                <div style={{
                  marginTop: '1rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '1rem',
                  padding: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{sel.display_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>
                        {ROLE_LABEL[sel.role] || sel.role}
                        {sel.role === 'assigned' ? ' — serving you right now' : ` at ${venueName || 'this venue'}`}
                      </div>
                      {(sel.total_shifts_completed != null || sel.performance_score != null) && (
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {sel.performance_score != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Star size={11} style={{ color: '#FFB300', fill: '#FFB300' }} /> {sel.performance_score.toFixed(1)}
                            </span>
                          )}
                          {sel.total_shifts_completed != null && sel.total_shifts_completed > 0 && (
                            <span>{sel.total_shifts_completed} shifts</span>
                          )}
                          {sel.total_likes != null && sel.total_likes > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Heart size={11} style={{ color: '#f87171', fill: '#f87171' }} /> {sel.total_likes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setProfileCrewId(sel.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0,
                        padding: '0.4rem 0.7rem', borderRadius: '0.5rem',
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                        color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <ExternalLink size={12} /> Profile
                    </button>
                  </div>

                  {sel.bio && (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: '0.75rem 0 0' }}>
                      {sel.bio}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                    <button
                      onClick={() => setShowTip(v => !v)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                        padding: '0.6rem', borderRadius: '0.6rem',
                        background: showTip ? 'var(--amber, #f59e0b)' : 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: showTip ? '#1a1a2e' : '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Gift size={14} /> {showTip ? 'Close tip' : 'Send tip'}
                    </button>
                    <button
                      onClick={() => setRatingCrew(sel)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                        padding: '0.6rem', borderRadius: '0.6rem',
                        background: 'var(--amber, #f59e0b)',
                        border: 'none', color: '#1a1a2e', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      <Star size={14} /> Rate & review
                    </button>
                  </div>

                  {showTip && onTip && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <CrewTipButton
                        crewName={sel.display_name}
                        onTip={(amount) => onTip({ id: sel.id, display_name: sel.display_name }, amount)}
                      />
                    </div>
                  )}
                  {showTip && !onTip && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      Tipping is available once your tab is open.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nested interaction overlays */}
      {ratingCrew && onRate && (
        <CrewRatingModal
          isOpen
          onClose={() => setRatingCrew(null)}
          crewName={ratingCrew.display_name}
          onSubmit={async (rating, comment) => {
            await onRate({ id: ratingCrew.id, display_name: ratingCrew.display_name }, rating, comment)
            setRatingCrew(null)
          }}
        />
      )}

      {profileCrewId && (
        <CrewProfileView
          isOpen
          onClose={() => setProfileCrewId(null)}
          crewId={profileCrewId}
        />
      )}
    </div>
  )
}
