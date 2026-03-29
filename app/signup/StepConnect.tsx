'use client'

import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepConnectProps {
  onVenueConnected: (slug: string) => void
}

type Mode = 'choose' | 'scan' | 'enter'

// ─── extractSlugFromQRCode ────────────────────────────────────────────────────
// Duplicated from app/start/page.tsx (not exported there, so copied here per spec)

function extractSlugFromQRCode(qrCode: string): string | null {
  const cleanCode = qrCode.trim()

  // Pattern 1: URL with ?bar= or &bar=
  const urlPattern = /[?&]bar=([a-z0-9\-]+)/i
  const urlMatch = cleanCode.match(urlPattern)
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toLowerCase()
  }

  // Pattern 2: slug= parameter
  const slugPattern = /[?&]slug=([a-z0-9\-]+)/i
  const slugMatch = cleanCode.match(slugPattern)
  if (slugMatch && slugMatch[1]) {
    return slugMatch[1].toLowerCase()
  }

  // Pattern 3: Direct slug format
  if (/^[a-z0-9\-]+$/i.test(cleanCode)) {
    return cleanCode.toLowerCase()
  }

  // Pattern 4: URL parsing fallback
  try {
    const url = new URL(cleanCode.includes('://') ? cleanCode : `https://${cleanCode}`)
    const params = new URLSearchParams(url.search)
    const barParam = params.get('bar') || params.get('slug')
    if (barParam) {
      return barParam.toLowerCase()
    }
  } catch {
    // Not a valid URL
  }

  return null
}

// ─── loadBarInfo ──────────────────────────────────────────────────────────────
// Queries the bars table for an active bar with the given slug.
// Returns the bar row on success, null if not found or inactive.

async function loadBarInfo(slug: string): Promise<{ id: string; name: string } | null> {
  const { data: bar, error } = await (supabase as any)
    .from('bars')
    .select('id, name, active, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !bar) return null
  if (bar.active === false) return null
  return bar
}

// ─── StepConnect ─────────────────────────────────────────────────────────────

export default function StepConnect({ onVenueConnected }: StepConnectProps) {
  const [mode, setMode] = useState<Mode>('choose')
  const [venueCode, setVenueCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  // ── Start QR scanner ────────────────────────────────────────────────────────
  const startScanner = async () => {
    if (!videoRef.current) return
    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleCodeDetected(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 1,
          returnDetailedScanResult: true,
        }
      )
      scannerRef.current = scanner
      await scanner.start()
    } catch (err) {
      setError('Unable to access camera. Please allow camera access or enter the venue code manually.')
      setMode('choose')
    }
  }

  // ── Stop / destroy scanner ──────────────────────────────────────────────────
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }
  }

  // ── Activate scan mode ──────────────────────────────────────────────────────
  const handleScanMode = () => {
    setError(null)
    setMode('scan')
  }

  // ── Activate enter-code mode ────────────────────────────────────────────────
  const handleEnterMode = () => {
    stopScanner()
    setError(null)
    setMode('enter')
  }

  // ── Process a raw code (from scanner or text input) ─────────────────────────
  const handleCodeDetected = async (raw: string) => {
    stopScanner()
    setError(null)
    setLoading(true)

    const slug = extractSlugFromQRCode(raw)
    if (!slug) {
      setError('Could not recognise that code. Please try again or enter the venue code manually.')
      setLoading(false)
      return
    }

    const bar = await loadBarInfo(slug)
    if (!bar) {
      setError('Venue not found or currently unavailable. Please check the code and try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    onVenueConnected(slug)
  }

  // ── Submit manual code ──────────────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!venueCode.trim()) {
      setError('Please enter a venue code.')
      return
    }
    await handleCodeDetected(venueCode.trim())
  }

  // ── Start scanner when mode switches to 'scan' ──────────────────────────────
  useEffect(() => {
    if (mode === 'scan') {
      startScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  // ── Styles ──────────────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    width: '100%',
  }

  const headingStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28,
    fontWeight: 600,
    color: 'var(--cream)',
    textAlign: 'center',
    margin: 0,
  }

  const subStyle: React.CSSProperties = {
    fontFamily: 'Lato, sans-serif',
    fontSize: 15,
    color: 'var(--muted)',
    textAlign: 'center',
    margin: 0,
  }

  const primaryBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    background: 'var(--amber)',
    color: 'var(--ink)',
    border: 'none',
    borderRadius: 8,
    fontFamily: 'Lato, sans-serif',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  }

  const secondaryBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    background: 'transparent',
    color: 'var(--amber)',
    border: '1.5px solid var(--amber)',
    borderRadius: 8,
    fontFamily: 'Lato, sans-serif',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--ink)',
    color: 'var(--cream)',
    border: '1.5px solid var(--amber-border)',
    borderRadius: 8,
    fontFamily: 'Lato, sans-serif',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const errorStyle: React.CSSProperties = {
    fontFamily: 'Lato, sans-serif',
    fontSize: 14,
    color: 'var(--danger)',
    textAlign: 'center',
    margin: 0,
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Connect to a venue</h2>
      <p style={subStyle}>Scan the QR code at your table or enter the venue code.</p>

      {/* Hidden video element — always in DOM so the ref is available */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          borderRadius: 8,
          display: mode === 'scan' ? 'block' : 'none',
          background: '#000',
          maxHeight: 280,
          objectFit: 'cover',
        }}
        playsInline
        muted
      />

      {/* ── Choose mode ── */}
      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <button style={primaryBtnStyle} onClick={handleScanMode} disabled={loading}>
            Scan QR code
          </button>
          <button style={secondaryBtnStyle} onClick={handleEnterMode} disabled={loading}>
            Enter venue code
          </button>
        </div>
      )}

      {/* ── Scan mode ── */}
      {mode === 'scan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <p style={{ ...subStyle, fontSize: 13 }}>Point your camera at the venue QR code.</p>
          <button style={secondaryBtnStyle} onClick={handleEnterMode} disabled={loading}>
            Enter venue code instead
          </button>
        </div>
      )}

      {/* ── Enter code mode ── */}
      {mode === 'enter' && (
        <form
          onSubmit={handleManualSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}
        >
          <input
            style={inputStyle}
            type="text"
            placeholder="e.g. sunset-lounge"
            value={venueCode}
            onChange={(e) => {
              setVenueCode(e.target.value)
              setError(null)
            }}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button style={primaryBtnStyle} type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Connect →'}
          </button>
          <button
            style={secondaryBtnStyle}
            type="button"
            onClick={handleScanMode}
            disabled={loading}
          >
            Scan QR code instead
          </button>
        </form>
      )}

      {/* ── Inline error ── */}
      {error && <p style={errorStyle}>{error}</p>}

      {/* ── Loading indicator ── */}
      {loading && (
        <p style={{ ...subStyle, fontSize: 13 }}>Verifying venue…</p>
      )}
    </div>
  )
}
