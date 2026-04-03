// app/start/StepHome.tsx
// Requirements: 7.1–7.7, 11.1–11.10
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import VisitFrequencyDots from '@/components/onboarding/VisitFrequencyDots'

// ── Types ──────────────────────────────────────────────────────────────────

interface StepHomeProps {
  user: {
    id: string
    email?: string
    user_metadata?: { first_name?: string; full_name?: string }
  } | null
  onVenueSelected: (venue: { id: string; slug: string; name: string; category?: string }) => void
  onScan: () => void
  onCodeSubmit: (slug: string) => void
}

interface RecentVenue {
  id: string
  slug: string
  name: string
  category?: string
  tabCount: number        // total tabs at this venue (for per-venue tier)
  weeklyVisits: number    // visits in past 7 days (for VisitFrequencyDots)
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Derive initials from user metadata or email. Requirement 7.1 */
function deriveInitials(
  user: StepHomeProps['user']
): string {
  const firstName = user?.user_metadata?.first_name
  if (firstName?.trim()) return firstName.trim()[0].toUpperCase()

  const email = user?.email
  if (email?.trim()) return email.trim()[0].toUpperCase()

  return '?'
}

/** Derive tier from tab count. Requirement 7.2
 * NOTE: This is used only for the per-venue visit frequency display in recent venues.
 * The actual spend-based badge (Bronze/Silver/Gold) requires loyalty API data per venue.
 * Tab count here approximates visit frequency only — not spend tier.
 */
function tierFromCount(count: number): 'bronze' | 'silver' | 'gold' {
  if (count >= 3) return 'gold'
  if (count >= 1) return 'silver'
  return 'bronze'
}

// ── Component ──────────────────────────────────────────────────────────────

export default function StepHome({ user, onVenueSelected, onScan, onCodeSubmit }: StepHomeProps) {
  const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([])
  const [venuesLoaded, setVenuesLoaded] = useState(false)
  const [codeInput, setCodeInput] = useState('')

  useEffect(() => {
    if (!user?.id) return
    loadRecentVenues(user.id)
  }, [user?.id])

  const loadRecentVenues = async (userId: string) => {
    try {
      // Use service-role API route to bypass RLS on tabs table
      const res = await fetch(`/api/tabs/recent-venues?customerId=${userId}`);
      if (!res.ok) {
        setVenuesLoaded(true);
        return;
      }
      const { tabs: data } = await res.json();

      if (!data || data.length === 0) {
        setVenuesLoaded(true);
        return;
      }

      // Aggregate per venue: count total tabs and weekly visits
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const venueMap = new Map<string, RecentVenue>()

      for (const row of data) {
        const bar = row.bars
        if (!bar?.id) continue

        if (!venueMap.has(bar.id)) {
          venueMap.set(bar.id, {
            id: bar.id,
            slug: bar.slug,
            name: bar.name,
            category: bar.category,
            tabCount: 0,
            weeklyVisits: 0,
          })
        }

        const venue = venueMap.get(bar.id)!
        venue.tabCount += 1

        const openedAt = new Date(row.opened_at)
        if (openedAt >= sevenDaysAgo) {
          venue.weeklyVisits += 1
        }
      }

      // Take the 5 most recently seen venues (map preserves insertion order)
      const venues = Array.from(venueMap.values()).slice(0, 5)

      setRecentVenues(venues)
      setVenuesLoaded(true)
    } catch (err) {
      // Requirement 7 (task note): silent failure — log and render only CTA
      console.error('[StepHome] Unexpected error loading recent venues:', err)
      setVenuesLoaded(true)
    }
  }

  const initials = deriveInitials(user)

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.25rem 2.5rem',
      }}
    >
      {/* ── Header: Avatar + Overall Tier ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem' }}>
        {/* Avatar — Requirement 7.1 */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--amber)',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.375rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-label="User avatar"
        >
          {initials}
        </div>

        <div>
          {/* Greeting — "Welcome back" only for returning users with prior venues */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--cream)',
              lineHeight: 1.2,
            }}
          >
            {user?.user_metadata?.first_name
              ? (venuesLoaded && recentVenues.length > 0
                  ? `Welcome back, ${user.user_metadata.first_name}`
                  : `Hey, ${user.user_metadata.first_name}`)
              : (venuesLoaded && recentVenues.length > 0
                  ? 'Welcome back'
                  : 'Hey there')}
          </p>
          {/* No overall badge — badge is earned per venue via spend threshold, not shown here */}
        </div>
      </div>

      {/* ── Motivational message — Requirement 7.5 ────────────────────── */}
      <p
        style={{
          fontFamily: "'Lato', sans-serif",
          fontStyle: 'italic',
          fontSize: '0.875rem',
          color: 'var(--muted)',
          marginBottom: '1.75rem',
          lineHeight: 1.5,
        }}
      >
        Visit and spend more to pay less and get freebies.
      </p>

      {/* ── Recent Venues — Requirement 7.3, 7.4 ─────────────────────── */}
      {venuesLoaded && recentVenues.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <p
            className="section-label"
            style={{ marginBottom: '0.75rem' }}
          >
            Recent venues
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentVenues.map((venue) => (
              <button
                key={venue.id}
                onClick={() =>
                  onVenueSelected({
                    id: venue.id,
                    slug: venue.slug,
                    name: venue.name,
                    category: venue.category,
                  })
                }
                style={{
                  background: 'var(--ink)',
                  border: '1px solid var(--amber-border)',
                  borderRadius: '0.5rem',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--amber)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--amber-border)')
                }
                aria-label={`Connect to ${venue.name}`}
              >
                {/* Left: venue name only — badge requires spend data from loyalty API */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: 'var(--cream)',
                    }}
                  >
                    {venue.name}
                  </span>
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {venue.tabCount} visit{venue.tabCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Right: visit frequency dots */}
                <VisitFrequencyDots visits={venue.weeklyVisits} max={7} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer pushes CTA to bottom when venues list is short */}
      <div style={{ flex: 1 }} />

      {/* ── CTA: Scan QR or enter code — column layout ────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Scan QR button */}
        <button
          onClick={onScan}
          style={{
            background: 'var(--amber)',
            color: 'var(--ink)',
            fontFamily: "'Lato', sans-serif",
            fontWeight: 700,
            fontSize: '1rem',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '1rem',
            width: '100%',
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Scan QR code
        </button>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '-0.25rem' }}>
          Point camera at the table code
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: '0.75rem',
            color: 'var(--muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            or enter code
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Slug input row */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const slug = codeInput.trim().toLowerCase()
            if (!slug) return
            setCodeInput('')
            onCodeSubmit(slug)
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="e.g. sunset-lounge"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              /* Dark-theme visibility: light background so text is readable */
              background: 'var(--ink2)',
              border: '1.5px solid var(--amber-border)',
              borderRadius: '0.5rem',
              color: 'var(--cream)',
              fontFamily: "'Lato', sans-serif",
              fontSize: '0.9375rem',
              outline: 'none',
              /* Placeholder needs explicit colour in dark themes */
              caretColor: 'var(--amber)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--amber)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--amber-border)' }}
          />
          <button
            type="submit"
            disabled={!codeInput.trim()}
            style={{
              padding: '0.875rem 1.25rem',
              background: codeInput.trim() ? 'var(--amber)' : 'var(--ink3)',
              color: codeInput.trim() ? 'var(--ink)' : 'var(--muted)',
              border: 'none',
              borderRadius: '0.5rem',
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: codeInput.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
          >
            Go
          </button>
        </form>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '-0.25rem' }}>
          Short code on your table card
        </p>

      </div>
    </div>
  )
}
