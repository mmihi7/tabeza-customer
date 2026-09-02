'use client'

import { useState } from 'react'
import { Loader, Check, X } from 'lucide-react'

interface CrewTipButtonProps {
  onTip: (amount: number) => Promise<void>
  crewName: string
  /** Quick preset amounts (KES). Defaults to 100/200/500 when omitted. */
  presetAmounts?: number[]
}

const DEFAULT_PRESETS = [100, 200, 500]

export default function CrewTipButton({ onTip, crewName, presetAmounts = DEFAULT_PRESETS }: CrewTipButtonProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleTip(amount: number) {
    if (amount <= 0) return

    setProcessing(true)
    setError('')

    try {
      await onTip(amount)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setSelectedAmount(null)
        setCustomAmount('')
        setShowCustom(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to process tip')
    } finally {
      setProcessing(false)
    }
  }

  function handleCustomSubmit() {
    const amount = parseFloat(customAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    handleTip(amount)
  }

  if (success) {
    return (
      <div style={{
        padding: '1rem',
        background: 'rgba(16,185,129,0.1)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}>
        <Check size={18} style={{ color: 'var(--success)' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>
          Tip sent successfully!
        </span>
      </div>
    )
  }

  return (
    <div style={{
      padding: '1rem',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      borderRadius: '0.75rem',
    }}>
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
        Tip {crewName} for great service?
      </p>

      {/* Preset Amounts */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              setSelectedAmount(amount)
              setShowCustom(false)
              handleTip(amount)
            }}
            disabled={processing}
            style={{
              flex: 1,
              padding: '0.625rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: selectedAmount === amount ? 'var(--amber)' : 'rgba(255,255,255,0.07)',
              border: selectedAmount === amount ? 'none' : '1px solid var(--border)',
              color: selectedAmount === amount ? '#1a1a2e' : 'var(--cream)',
              cursor: processing ? 'not-allowed' : 'pointer',
              opacity: processing ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
            }}
          >
            {processing && selectedAmount === amount ? (
              <Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
            ) : (
              `KES ${amount}`
            )}
          </button>
        ))}
      </div>

      {/* Custom Amount */}
      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          style={{
            width: '100%',
            padding: '0.625rem',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            background: 'none',
            border: '1px dashed var(--border)',
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          Custom amount
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            style={{
              flex: 1,
              padding: '0.625rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              color: 'var(--cream)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={processing || !customAmount}
            style={{
              padding: '0.625rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: 'var(--amber)',
              border: 'none',
              color: '#1a1a2e',
              cursor: processing || !customAmount ? 'not-allowed' : 'pointer',
              opacity: processing || !customAmount ? 0.6 : 1,
            }}
          >
            {processing ? <Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Send'}
          </button>
          <button
            onClick={() => {
              setShowCustom(false)
              setCustomAmount('')
            }}
            style={{
              padding: '0.625rem',
              borderRadius: '0.5rem',
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.75rem', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
