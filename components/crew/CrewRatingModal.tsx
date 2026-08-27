'use client'

import { useState } from 'react'
import { Star, X, Loader } from 'lucide-react'

interface CrewRatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, comment?: string) => Promise<void>
  crewName: string
}

export default function CrewRatingModal({ isOpen, onClose, onSubmit, crewName }: CrewRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleSubmit() {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onSubmit(rating, comment || undefined)
      onClose()
      // Reset form
      setRating(0)
      setComment('')
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
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
        padding: '1.5rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--cream)' }}>
            Rate Your Experience
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

        {/* Crew Name */}
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          How was your service with <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{crewName}</span>?
        </p>

        {/* Star Rating */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'transform 0.15s',
                transform: (hoveredRating >= star || rating >= star) ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <Star
                size={36}
                style={{
                  color: (hoveredRating >= star || rating >= star) ? 'var(--amber)' : 'var(--border)',
                  fill: (hoveredRating >= star || rating >= star) ? 'var(--amber)' : 'transparent',
                  transition: 'color 0.15s, fill 0.15s',
                }}
              />
            </button>
          ))}
        </div>

        {/* Rating Label */}
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {rating === 0 && 'Tap a star to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </p>

        {/* Comment */}
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--cream)',
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid var(--border)',
              color: 'var(--cream)',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: rating === 0 ? 'rgba(255,79,0,0.3)' : 'var(--amber)',
              border: 'none',
              color: rating === 0 ? 'var(--muted)' : '#1a1a2e',
              cursor: rating === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {submitting ? (
              <>
                <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
