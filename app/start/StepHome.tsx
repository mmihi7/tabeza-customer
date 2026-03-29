// app/start/StepHome.tsx
// Requirements: 7.1–7.7, 11.1–11.10
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TierBadge from '@/components/onboarding/TierBadge'
import VisitFrequencyDots from '@/components/onboarding/VisitFrequencyDots'

// ── Types ──────────────────────────────────────────────────────────────────

interface StepHomeProps {
  user: {
    id: string
    email?: string
    user_metadata?: { first_name?: string; full_name?: string }
  } | null
  onVenueSelected: (venue: { id: string; slug: string; name: string; category?: string }) => void
  onScanOrEnter: () => void
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

/** Derive tier from tab count. Requirement 7.2 */
function tierFromCount(count: number): 'bronze' | 'silver' | 'gold' {
  if (count >= 3) return 'gold'
  if (count >= 1) return 'silver'
  return 'bronze'
}

// ── Component ──────────────────────────────────────────────────────────────

export default function StepHome({ user, onVenueSelected, onScanOrEnter }: StepHomeProps) {
  const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([])
  const [overallTier, setOverallTier] = useState<'bronze' | 'silver' | 'gold'>('bronze')
  const [venuesLoaded, setVenuesLoaded] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadRecentVenues(user.id)
  }, [user?.id])

  const loadRecentVenues = async (userId: string) => {
    try {
      // Fetch the 5 most recently opened tabs for this user, joined to bars.
      // Design doc: query tabs joined to bars, limit 5, ordered by opened_at desc.
      const { data, error } = await (supabase as any)
        .from('tabs')
        .select('bar_id, opened_at, bars(id, name, slug, category)')
        .eq('customer_id', userId)
        .order('opened_at', { ascending: false })
        .limit(20) // fetch more so we can aggregate per venue

      if (error) {
        console.error('[StepHome] Recent venues query failed:', error)
        setVenuesLoaded(true)
        return
      }

      if (!data || data.length === 0) {
        setVenuesLoaded(true)
        return
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

      // Overall tier: based on total tab count across all venues
      const totalTabs = data.length
      setOverallTier(tierFromCount(totalTabs))
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
          {/* Greeting */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--cream)',
              lineHeight: 1.2,
              marginBottom: '0.25rem',
            }}
          >
            {user?.user_metadata?.first_name
              ? `Hey, ${user.user_metadata.first_name}`
              : 'Welcome back'}
          </p>

          {/* Overall TierBadge — Requirement 7.2 */}
          <TierBadge tier={overallTier} />
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
                {/* Left: venue name + tier badge */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
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
                  <TierBadge tier={tierFromCount(venue.tabCount)} />
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

      {/* ── Primary CTA — Requirement 7.6, 7.7 ───────────────────────── */}
      <button
        onClick={onScanOrEnter}
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
        Scan QR / enter code →
      </button>
    </div>
  )
}
