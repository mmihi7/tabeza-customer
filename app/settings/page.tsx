// app/settings/page.tsx — Customer settings page
// Notifications toggle, sign out, delete account.

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Bell, LogOut, Trash2, ArrowLeft, AlertTriangle, Check, Percent } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { getDeviceId, getActiveTab } from '@/lib/device-identity'

const DEVICE_NOTIFICATIONS_KEY = 'tabeza_customer_notifications_enabled'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Per-venue outbound promo consent ("Deals from this venue")
  const [promoOptInEnabled, setPromoOptInEnabled] = useState(false)
  const [promoOptInLoaded, setPromoOptInLoaded] = useState(false)
  const [venueContext, setVenueContext] = useState<{ barId: string; customerId?: string | null; deviceId?: string | null } | null>(null)

  // Load device-level notification preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEVICE_NOTIFICATIONS_KEY)
      if (stored !== null) {
        setNotificationsEnabled(stored !== 'false')
      }
    } catch {}
  }, [])

  // Resolve the customer's current venue (from the stored active tab) and load
  // its outbound-promo consent. Works for authenticated customers (customer_id)
  // and anonymous device users (device_identifier).
  useEffect(() => {
    ;(async () => {
      try {
        const activeTab = getActiveTab()
        if (!activeTab?.bar_id) return
        const barId = activeTab.bar_id
        const customerId = activeTab.customer_id || null
        const deviceId = activeTab.device_identifier || null
        if (!customerId && !deviceId) return

        setVenueContext({ barId, customerId, deviceId })

        const idParam = customerId
          ? `customerId=${encodeURIComponent(customerId)}`
          : `deviceId=${encodeURIComponent(deviceId)}`
        const res = await fetch(`/api/customer/promo-consent?barId=${encodeURIComponent(barId)}&${idParam}`)
        const json = await res.json().catch(() => ({}))
        setPromoOptInEnabled(json?.consent?.scope === 'always')
      } catch {
        // no active venue — deals toggle hidden
      } finally {
        setPromoOptInLoaded(true)
      }
    })()
  }, [])

  const toggleDeals = async (next: boolean) => {
    if (!venueContext) return
    const previous = promoOptInEnabled
    setPromoOptInEnabled(next)
    try {
      const body: Record<string, string> = {
        barId: venueContext.barId,
        scope: next ? 'always' : 'at_venue_only',
      }
      if (venueContext.customerId) body.customerId = venueContext.customerId
      else if (venueContext.deviceId) body.deviceId = venueContext.deviceId

      const res = await fetch('/api/customer/promo-consent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update promo settings')
    } catch (err) {
      console.error('Failed to update promo consent:', err)
      setPromoOptInEnabled(previous)
    }
  }

  const toggleNotifications = async () => {
    const next = !notificationsEnabled
    setNotificationsEnabled(true) // optimistic
    setSavingNotifications(true)

    try {
      // Persist device-level preference
      localStorage.setItem(DEVICE_NOTIFICATIONS_KEY, String(next))

      // If there's an active tab, also sync to the tab's notes
      const activeTab = await getActiveTab()
      if (activeTab?.id) {
        await fetch(`/api/tabs/${activeTab.id}/notification-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationsEnabled: next }),
        })
      }

      // Request browser permission if turning on
      if (next && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    } catch (err) {
      console.error('Failed to update notifications:', err)
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ confirm: true }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete account')
      }

      // Account deleted — clear local state and redirect
      localStorage.removeItem(DEVICE_NOTIFICATIONS_KEY)
      await signOut()
      router.push('/login')
    } catch (err: any) {
      console.error('Delete account failed:', err)
      alert(err?.message || 'Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white sticky top-0 z-20 shadow-lg">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <Settings size={18} />
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">

        {/* Notifications */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} style={{ color: '#FF4F00' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Push Notifications</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Order updates, messages & alerts</p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              disabled={savingNotifications}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{
                backgroundColor: notificationsEnabled ? '#FF4F00' : 'rgba(255,255,255,0.15)',
                opacity: savingNotifications ? 0.6 : 1,
              }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                style={{ transform: notificationsEnabled ? 'translateX(19px)' : 'translateX(3px)' }}
              />
            </button>
          </div>

          {/* Deals from this venue — per-venue outbound promo opt-in */}
          {venueContext && (
            <div
              className="mt-3 pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Percent size={18} style={{ color: '#FF4F00' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Deals from this venue</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Occasional offers even when you are away</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleDeals(!promoOptInEnabled)}
                  disabled={!promoOptInLoaded}
                  aria-pressed={promoOptInEnabled}
                  className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: promoOptInEnabled ? '#FF4F00' : 'rgba(255,255,255,0.15)',
                    opacity: promoOptInLoaded ? 1 : 0.5,
                  }}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                    style={{ transform: promoOptInEnabled ? 'translateX(19px)' : 'translateX(3px)' }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account info */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>Signed in as</p>
          <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
            {user?.email || 'Anonymous'}
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl p-4 flex items-center gap-3 transition-colors hover:bg-white hover:bg-opacity-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <LogOut size={18} style={{ color: '#94a3b8' }} />
          <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Sign Out</span>
        </button>

        {/* Delete account */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full rounded-xl p-4 flex items-center gap-3 transition-colors hover:bg-white hover:bg-opacity-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <Trash2 size={18} style={{ color: '#ef4444' }} />
          <span className="text-sm font-medium" style={{ color: '#ef4444' }}>Delete Account</span>
        </button>

        <p className="text-center text-xs" style={{ color: '#64748b' }}>
          This will permanently delete your account, tabs, orders and payment history.
        </p>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div
            className="rounded-xl p-6 w-full max-w-sm"
            style={{ backgroundColor: '#1e293b', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} style={{ color: '#ef4444' }} />
              <h3 className="text-base font-bold" style={{ color: '#e2e8f0' }}>Delete Account?</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
              This action is permanent and cannot be undone. All your tabs, orders, and payment history will be erased.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: deleting ? 'rgba(239,68,68,0.5)' : '#ef4444',
                  color: '#fff',
                }}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Deleting…
                  </>
                ) : (
                  'Delete Everything'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
