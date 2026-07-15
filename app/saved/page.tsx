'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Logo from '@/components/Logo'
import { Star, MapPin, ChevronRight } from 'lucide-react'

// Mock data for saved restaurants (replace with real data from API)
const mockSavedRestaurants = [
  { id: '1', name: 'Sunset Lounge', location: 'Westlands', slug: 'sunset-lounge', lastVisited: '2 days ago' },
  { id: '2', name: 'Brew & Bites', location: 'Kilimani', slug: 'brew-bites', lastVisited: '1 week ago' },
  { id: '3', name: 'The Velvet Room', location: 'CBD', slug: 'velvet-room', lastVisited: '3 weeks ago' },
]

export default function SavedRestaurantsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user, loading } = useAuth()
  const [savedRestaurants, setSavedRestaurants] = useState(mockSavedRestaurants)

  // TODO: Fetch saved restaurants from API
  useEffect(() => {
    if (!user) return
    // fetchSavedRestaurants()
  }, [user])

  const handleQuickConnect = (slug: string) => {
    router.push(`/?bar=${slug}`)
  }

  const handleRemoveSaved = (id: string) => {
    setSavedRestaurants(prev => prev.filter(r => r.id !== id))
    showToast({
      type: 'success',
      title: 'Removed',
      message: 'Restaurant removed from saved list',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4F00] to-[#CC3F00]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="md" className="text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Saved Restaurants</h1>
              <p className="text-white/80 text-sm">Quickly connect to your favorite places</p>
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
        {!user ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign in to save restaurants</h2>
            <p className="text-gray-600 mb-6">
              Create an account or sign in with Google to save your favorite restaurants for quick access.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white rounded-xl font-semibold hover:from-[#FF4F00] hover:to-red-700 transition"
            >
              Sign In
            </button>
          </div>
        ) : savedRestaurants.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No saved restaurants yet</h2>
            <p className="text-gray-600 mb-6">
              When you visit a bar, you can save it here for quick connections later.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white rounded-xl font-semibold hover:from-[#FF4F00] hover:to-red-700 transition"
            >
              Explore Bars
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {savedRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Star size={24} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{restaurant.name}</h3>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} />
                          <span>{restaurant.location}</span>
                          <span className="text-sm text-gray-500">• Last visited {restaurant.lastVisited}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-4">
                      Quickly open a tab at this restaurant without scanning a QR code.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 ml-4">
                    <button
                      onClick={() => handleQuickConnect(restaurant.slug)}
                      className="px-6 py-3 bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white rounded-xl font-semibold hover:from-[#FF4F00] hover:to-red-700 transition flex items-center justify-center gap-2"
                    >
                      <span>Quick Connect</span>
                      <ChevronRight size={20} />
                    </button>
                    <button
                      onClick={() => handleRemoveSaved(restaurant.id)}
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

        {/* How it works section */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">How Saved Restaurants Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/20 p-6 rounded-xl">
              <div className="text-white text-3xl font-bold mb-2">1</div>
              <h3 className="text-white font-semibold text-lg mb-2">Visit a Bar</h3>
              <p className="text-white/80">
                Scan a bar's QR code or enter its code to open a tab.
              </p>
            </div>
            <div className="bg-white/20 p-6 rounded-xl">
              <div className="text-white text-3xl font-bold mb-2">2</div>
              <h3 className="text-white font-semibold text-lg mb-2">Save for Later</h3>
              <p className="text-white/80">
                While at the bar, tap "Save this restaurant" to add it to your list.
              </p>
            </div>
            <div className="bg-white/20 p-6 rounded-xl">
              <div className="text-white text-3xl font-bold mb-2">3</div>
              <h3 className="text-white font-semibold text-lg mb-2">Quick Connect</h3>
              <p className="text-white/80">
                Return anytime and open a tab instantly without scanning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}