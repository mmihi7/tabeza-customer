'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Logo from '@/components/Logo'
import { Star, MapPin, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SavedBar {
  id: string
  savedAt: string
  bar: {
    id: string
    name: string
    slug: string
    logoUrl?: string
    city?: string
    neighborhood?: string
  }
}

export default function SavedRestaurantsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const [savedBars, setSavedBars] = useState<SavedBar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  /** Resolve customer_id from user.id */
  const resolveCustomerId = useCallback(async (userId: string): Promise<string | null> => {
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
  }, [])

  const loadSavedBars = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const customerId = await resolveCustomerId(user.id)
      if (!customerId) {
        setError('Could not find your account. Please try again.')
        setLoading(false)
        return
      }

      const res = await fetch(`${baseUrl}/api/customer/saved-bars?customerId=${customerId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load saved places')
      }

      const { savedBars } = await res.json()
      setSavedBars(savedBars ?? [])
    } catch (err: any) {
      console.error('[saved page] Error loading saved bars:', err)
      setError(err.message || 'Failed to load saved places')
    } finally {
      setLoading(false)
    }
  }, [user?.id, baseUrl, resolveCustomerId])

  useEffect(() => {
    if (!authLoading && user) {
      loadSavedBars()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [authLoading, user, loadSavedBars])

  const handleQuickConnect = (slug: string) => {
    router.push(`/?bar=${slug}`)
  }

  const handleRemoveSaved = async (barId: string) => {
    if (!user?.id) return
    const customerId = await resolveCustomerId(user.id)
    if (!customerId) return

    try {
      const res = await fetch(`${baseUrl}/api/customer/saved-bars?customerId=${customerId}&barId=${barId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove')
      setSavedBars(prev => prev.filter(s => s.bar.id !== barId))
      showToast({
        type: 'success',
        title: 'Removed',
        message: 'Restaurant removed from saved list',
      })
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove. Please try again.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4F00] to-[#CC3F00]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="md" className="text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Saved Places</h1>
              <p className="text-white/80 text-sm">Quickly connect to your favorite venues</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
          >
            Back Home
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Loading saved places...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <X size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadSavedBars}
              className="px-6 py-3 bg-[#FF4F00] text-white rounded-xl font-semibold hover:bg-[#CC3F00] transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Not authenticated */}
        {!loading && !error && !user && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign in to see saved places</h2>
            <p className="text-gray-600 mb-6">
              Create an account or sign in to save your favorite venues for quick access.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white rounded-xl font-semibold hover:from-[#FF4F00] hover:to-red-700 transition"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && user && savedBars.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No saved places yet</h2>
            <p className="text-gray-600 mb-6">
              When you visit a venue, tap the star to save it here for quick connections later.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white rounded-xl font-semibold hover:from-[#FF4F00] hover:to-red-700 transition"
            >
              Explore Venues
            </button>
          </div>
        )}

        {/* Saved bars list */}
        {!loading && !error && savedBars.length > 0 && (
          <div className="grid gap-6">
            {savedBars.map((saved) => (
              <div
                key={saved.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-[#FFE8DF] rounded-xl flex items-center justify-center">
                        {saved.bar.logoUrl ? (
                          <img
                            src={saved.bar.logoUrl}
                            alt={saved.bar.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Star size={24} className="text-[#FF4F00]" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{saved.bar.name}</h3>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} />
                          <span>
                            {[saved.bar.neighborhood, saved.bar.city].filter(Boolean).join(', ') || 'Nairobi'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-4">
                      Open a tab instantly at this venue without scanning a QR code.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Saved {new Date(saved.savedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 ml-4">
                    <button
                      onClick={() => handleQuickConnect(saved.bar.slug)}
                      className="px-6 py-3 bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white rounded-xl font-semibold hover:from-[#FF4F00] hover:to-red-700 transition flex items-center justify-center gap-2"
                    >
                      <span>Quick Connect</span>
                      <ChevronRight size={20} />
                    </button>
                    <button
                      onClick={() => handleRemoveSaved(saved.bar.id)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}