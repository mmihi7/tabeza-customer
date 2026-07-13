'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X } from 'lucide-react'

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  type: string
  class: string
  // context fields
  address: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
    suburb?: string
  }
}

interface LocationSearchProps {
  /** Called when user selects a location */
  onSelect: (location: {
    label: string       // human-readable "Westlands, Nairobi"
    county?: string     // "Nairobi County"
    town?: string       // "Nairobi"
    area?: string       // "Westlands"
    lat?: number
    lng?: number
  }) => void
  /** Current value to display */
  value?: string
  /** Placeholder text */
  placeholder?: string
  /** Optional className for the container */
  className?: string
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export default function LocationSearch({
  onSelect,
  value = '',
  placeholder = 'Search for a town or area in Kenya...',
  className = '',
}: LocationSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function doSearch(q: string) {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    setSearching(true)
    const params = new URLSearchParams({
      q: `${trimmed}, Kenya`,
      format: 'json',
      limit: '7',
      countrycodes: 'ke',
      addressdetails: '1',
    })

    fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        // Nominatim requires a custom User-Agent with contact info
        'User-Agent': 'TabezaCrewApp/1.0 (tabeza.co.ke)',
        'Accept-Language': 'en',
      },
    })
      .then(res => res.json())
      .then((data: NominatimResult[]) => {
        setResults(data)
        setOpen(data.length > 0)
      })
      .catch(() => {
        setResults([])
        setOpen(false)
      })
      .finally(() => setSearching(false))
  }

  function handleInput(val: string) {
    setQuery(val)
    setOpen(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  function selectResult(item: NominatimResult) {
    const addr = item.address || {}
    const town = addr.city || addr.town || addr.village || addr.county || ''
    const county = addr.state || addr.county || ''
    const area = addr.suburb || ''
    const label = [area, town].filter(Boolean).join(', ') || item.display_name.split(',')[0]

    onSelect({
      label,
      county,
      town,
      area,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    })

    setQuery(label)
    setOpen(false)
  }

  function clearSelection() {
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect({ label: '' })
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.625rem 0.875rem',
        background: 'var(--background-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: '0.625rem',
      }}>
        <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: '0.875rem', color: 'var(--text-primary)',
            outline: 'none', minWidth: 0,
          }}
          autoComplete="off"
        />
        {searching && (
          <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--amber)', animation: 'loc-search-spin 0.5s linear infinite' }} />
        )}
        {query && !searching && (
          <button onClick={clearSelection} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={14} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          marginTop: '0.25rem',
          background: 'var(--background-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: '0.625rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxHeight: 280, overflowY: 'auto',
        }}>
          {results.map((item, i) => {
            const addr = item.address || {}
            const town = addr.city || addr.town || addr.village || ''
            const county = addr.state || addr.county || ''
            const area = addr.suburb || ''
            return (
              <button
                key={`${item.lat}-${item.lon}-${i}`}
                onClick={() => selectResult(item)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                  width: '100%', padding: '0.65rem 0.875rem',
                  border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <MapPin size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {[area, town].filter(Boolean).join(', ') || item.display_name.split(',')[0]}
                  </div>
                  {county && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                      {county} County
                    </div>
                  )}
                  {item.type && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.05rem', textTransform: 'capitalize' }}>
                      {item.type.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <style>{`@keyframes loc-search-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
