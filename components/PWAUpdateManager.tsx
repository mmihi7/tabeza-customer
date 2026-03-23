'use client'

import React, { useState, useEffect } from 'react'

export default function PWAUpdateManager() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [])

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <h4 className="font-semibold mb-2">Update Available</h4>
      <p className="text-sm mb-3">A new version of the app is available.</p>
      <button
        onClick={updateApp}
        className="bg-white text-blue-500 px-4 py-2 rounded font-medium text-sm"
      >
        Update Now
      </button>
    </div>
  )
}
