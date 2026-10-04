'use client'

// ManagerChefCards — the two people a guest is most likely to want to reach at a
// venue, shown on the "Connecting to <venue>" confirm step before the tab opens.
//
// Both slots always render. An unfilled slot is the nudge: it tells the guest
// who runs the room and who runs the kitchen, and tells the venue there is a
// visible gap worth filling. Data comes from the venue roster (bar_crew_members)
// via /api/venue/team/[barId] — the same source the "Our team" modal uses.

import { useEffect, useState } from 'react'
import type { VenueTeamMember } from './VenueCrewModal'

interface ManagerChefCardsProps {
  barId: string | null | undefined
}

interface Slot {
  role: string
  title: string
  emoji: string
  accent: string
}

/** Fixed order, always both. Gender-neutral ZWJ emoji. */
const SLOTS: Slot[] = [
  { role: 'manager', title: 'Manager', emoji: '\u{1F9D1}\u{1F4BC}', accent: '#FFB300' },
  { role: 'chef',    title: 'Chef',    emoji: '\u{1F9D1}\u{1F373}', accent: '#f97316' },
]

export default function ManagerChefCards({ barId }: ManagerChefCardsProps) {
  const [team, setTeam] = useState<VenueTeamMember[]>([])

  useEffect(() => {
    if (!barId) {
      setTeam([])
      return
    }
    let cancelled = false
    fetch(`/api/venue/team/${encodeURIComponent(barId)}`)
      .then((res) => (res.ok ? res.json() : { team: [] }))
      .then((data) => {
        if (cancelled) return
        setTeam((data.team ?? []) as VenueTeamMember[])
      })
      .catch(() => {
        if (!cancelled) setTeam([])
      })
    return () => { cancelled = true }
  }, [barId])

  // First rostered person wins each slot; extra managers/chefs stay in "Our team".
  return (
    <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem' }}>
      {SLOTS.map((slot) => {
        const member = team.find((m) => m.role === slot.role)
        const photo = member?.face_thumbnail_url || member?.face_photo_url
        // The endpoint drops roster rows with no display_name, so an empty name
        // means the slot is unfilled.
        const name = member?.display_name ?? ''
        const filled = name !== ''

        return (
          <div
            key={slot.role}
            style={{
              flex: 1,
              minWidth: 0,
              border: `1px solid ${filled ? slot.accent + '55' : 'var(--border)'}`,
              background: filled ? slot.accent + '0D' : 'rgba(255,255,255,0.02)',
              borderRadius: '0.5rem',
              padding: '0.875rem 0.625rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                flexShrink: 0,
                overflow: 'hidden',
                background: 'var(--amber-pale)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                lineHeight: 1,
                opacity: filled ? 1 : 0.55,
              }}
            >
              {photo ? (
                <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span aria-hidden="true">{slot.emoji}</span>
              )}
            </div>

            <div style={{ width: '100%', minWidth: 0, textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: filled ? slot.accent : 'var(--muted)',
                  marginBottom: '0.125rem',
                }}
              >
                {slot.title}
              </p>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '0.8125rem',
                  fontWeight: filled ? 700 : 400,
                  fontStyle: filled ? 'normal' : 'italic',
                  color: filled ? 'var(--cream)' : 'var(--muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {filled ? name : '(unassigned)'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}