// app/start/StepHome.tsx
// Requirements: 7.1–7.7, 11.1–11.10
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDeviceId } from '@/lib/device-identity'
import VisitFrequencyDots from '@/components/onboarding/VisitFrequencyDots'
import { Star } from 'lucide-react'

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
  isSaved?: boolean       // whether this venue is in saved places
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

// ── Component ──────────────────────────────────────────────────────────────

export default function StepHome({ user, onVenueSelected, onScan, onCodeSubmit }: StepHomeProps) {
  const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([])
  const [savedVenues, setSavedVenues] = useState<RecentVenue[]>([])
  const [venuesLoaded, setVenuesLoaded] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [savingVenueId, setSavingVenueId] = useState<string | null>(null)

  useEffect(() => {
    // Load venues for both authenticated and anonymous users.
    // Authenticated users: resolve customer_id, fetch recent + saved bars.
    // Anonymous users: use device_id to fetch recent tabs (no saved bars).
    loadVenueData()
  }, [user?.id])

  /** Resolve customer_id from user.id via the customers table */
  const resolveCustomerId = async (userId: string): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      return data?.id ?? null
    } catch {
      return null
    }
  }

  const loadVenueData = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

    // Determine lookup keys: customer_id (authenticated) AND/OR device_id
    // (anonymous). Querying with both makes recent venues appear even when a
    // customer's tabs were opened on a device before they had a customer row.
    let customerId: string | null = null
    let deviceIdentifier: string | null = null

    if (user?.id) {
      customerId = await resolveCustomerId(user.id)
    }
    try {
      deviceIdentifier = await getDeviceId()
    } catch {
      deviceIdentifier = null
    }

    if (!customerId && !deviceIdentifier) {
      setVenuesLoaded(true)
      return
    }

    const params = new URLSearchParams()
    if (customerId) params.set('customerId', customerId)
    if (deviceIdentifier) params.set('deviceIdentifier', deviceIdentifier)
    const lookupParam = params.toString()

    try {
      // Fetch recent venues
      const recentPromise = fetch(`/api/tabs/recent-venues?${lookupParam}`)

      // Saved bars only available for authenticated users with a customer record
      const savedPromise = customerId
        ? fetch(`${baseUrl}/api/customer/saved-bars?customerId=${customerId}`)
        : Promise.resolve(null)

      const [recentRes, savedRes] = await Promise.all([recentPromise, savedPromise])

      // Parse saved bars for fast lookup
      const savedBarIds = new Set<string>()
      const savedVenuesList: RecentVenue[] = []

      if (savedRes && savedRes.ok) {
        const { savedBars } = await savedRes.json()
        if (savedBars && Array.isArray(savedBars)) {
          for (const s of savedBars) {
            if (s.bar?.id) {
              savedBarIds.add(s.bar.id)
              savedVenuesList.push({
                id: s.bar.id,
                slug: s.bar.slug,
                name: s.bar.name,
                category: s.bar.city || undefined,
                tabCount: 0,
                weeklyVisits: 0,
                isSaved: true,
              })
            }
          }
        }
      }

      // Parse recent venues from tabs
      const recentVenuesList: RecentVenue[] = []
      if (recentRes.ok) {
        const { tabs } = await recentRes.json()
        if (tabs && Array.isArray(tabs) && tabs.length > 0) {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const venueMap = new Map<string, RecentVenue>()

          for (const row of tabs) {
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
                isSaved: savedBarIds.has(bar.id),
              })
            }

            const venue = venueMap.get(bar.id)!
            venue.tabCount += 1

            const openedAt = new Date(row.opened_at)
            if (openedAt >= sevenDaysAgo) {
              venue.weeklyVisits += 1
            }
          }

          // Take the 5 most recently seen
          const venues = Array.from(venueMap.values()).slice(0, 5)
          recentVenuesList.push(...venues)
        }
      }

      setRecentVenues(recentVenuesList)
      setSavedVenues(savedVenuesList)
      setVenuesLoaded(true)
    } catch (err) {
      console.error('[StepHome] Unexpected error loading venues:', err)
      setVenuesLoaded(true)
    }
  }

  // Toggle save/favorite for a venue
  const toggleSaveVenue = async (e: React.MouseEvent, venue: RecentVenue) => {
    e.stopPropagation() // don't trigger venue selection
    if (!user?.id) return

    setSavingVenueId(venue.id)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const customerId = await resolveCustomerId(user.id)
    if (!customerId) {
      setSavingVenueId(null)
      return
    }

    try {
      if (venue.isSaved) {
        await fetch(`${baseUrl}/api/customer/saved-bars?customerId=${customerId}&barId=${venue.id}`, { method: 'DELETE' })
        // Update state
        setRecentVenues(prev => prev.map(v => v.id === venue.id ? { ...v, isSaved: false } : v))
        setSavedVenues(prev => prev.filter(v => v.id !== venue.id))
      } else {
        await fetch(`${baseUrl}/api/customer/saved-bars`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, barId: venue.id }),
        })
        setRecentVenues(prev => prev.map(v => v.id === venue.id ? { ...v, isSaved: true } : v))
        if (!savedVenues.find(v => v.id === venue.id)) {
          setSavedVenues(prev => [...prev, { ...venue, isSaved: true }])
        }
      }
    } catch { /* silent */ }
    setSavingVenueId(null)
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
              ? (venuesLoaded && (recentVenues.length > 0 || savedVenues.length > 0)
                  ? `Welcome back, ${user.user_metadata.first_name}`
                  : `Hey, ${user.user_metadata.first_name}`)
              : (venuesLoaded && (recentVenues.length > 0 || savedVenues.length > 0)
                  ? 'Welcome back'
                  : 'Hey there')}
          </p>
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

      {/* ── Saved Places — Requirement 7.3, 7.4 ─────────────────────── */}
      {venuesLoaded && savedVenues.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>
            Saved places
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {savedVenues.map((venue) => (
              <div key={venue.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() =>
                    onVenueSelected({
                      id: venue.id,
                      slug: venue.slug,
                      name: venue.name,
                      category: venue.category,
                    })
                  }
                  style={{
                    flex: 1,
                    background: 'var(--ink)',
                    border: '1px solid var(--amber-border)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
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
                      Saved
                    </span>
                  </div>
                </button>
                {/* Save toggle */}
                <button
                  onClick={(e) => toggleSaveVenue(e, venue)}
                  disabled={savingVenueId === venue.id}
                  style={{
                    flexShrink: 0,
                    padding: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
                  }
                  title="Remove from saved"
                >
                  <Star size={18} fill="#FFD700" stroke="#FFD700" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Venues — Requirement 7.3, 7.4 ─────────────────────── */}
      {venuesLoaded && recentVenues.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>
            Recent venues
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentVenues.map((venue) => (
              <div key={venue.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() =>
                    onVenueSelected({
                      id: venue.id,
                      slug: venue.slug,
                      name: venue.name,
                      category: venue.category,
                    })
                  }
                  style={{
                    flex: 1,
                    background: 'var(--ink)',
                    border: '1px solid var(--amber-border)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
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
                  {/* Left: venue name */}
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
                      {venue.isSaved && ' · Saved'}
                    </span>
                  </div>

                  {/* Right: visit frequency dots */}
                  <div className="flex items-center gap-2">
                    <VisitFrequencyDots visits={venue.weeklyVisits} max={7} />
                    <button
                      onClick={(e) => toggleSaveVenue(e, venue)}
                      disabled={savingVenueId === venue.id}
                      style={{
                        flexShrink: 0,
                        padding: '0.25rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '50%',
                      }}
                      title={venue.isSaved ? 'Remove from saved' : 'Save this place'}
                    >
                      <Star
                        size={16}
                        fill={venue.isSaved ? '#FFD700' : 'transparent'}
                        stroke={venue.isSaved ? '#FFD700' : '#a0a0a0'}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                </button>
              </div>
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
              background: 'var(--ink2)',
              border: '1.5px solid var(--amber-border)',
              borderRadius: '0.5rem',
              color: 'var(--cream)',
              fontFamily: "'Lato', sans-serif",
              fontSize: '0.9375rem',
              outline: 'none',
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