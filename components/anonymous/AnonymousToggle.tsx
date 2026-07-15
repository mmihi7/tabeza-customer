'use client'

import { useState, useEffect } from 'react'

interface AnonymousToggleProps {
  barId?: string
  defaultChecked?: boolean
  onChange?: (anonymous: boolean) => void
  disabled?: boolean
}

export default function AnonymousToggle({
  barId,
  defaultChecked = false,
  onChange,
  disabled = false,
}: AnonymousToggleProps) {
  const [anonymous, setAnonymous] = useState(defaultChecked)

  // Load saved preference from localStorage if barId provided
  useEffect(() => {
    if (!barId) return
    const key = `tabeza_anonymous_${barId}`
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        setAnonymous(saved === 'true')
      }
    } catch (error) {
      console.warn('Failed to load anonymous preference', error)
    }
  }, [barId])

  const handleToggle = (checked: boolean) => {
    setAnonymous(checked)
    if (barId) {
      try {
        localStorage.setItem(`tabeza_anonymous_${barId}`, checked.toString())
      } catch (error) {
        console.warn('Failed to save anonymous preference', error)
      }
    }
    onChange?.(checked)
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center h-5">
        <input
          id="anonymous-toggle"
          type="checkbox"
          checked={anonymous}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-[#FFF5F0]0 border-gray-300 rounded focus:ring-[#FF4F00] focus:ring-2"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="anonymous-toggle" className="font-medium text-gray-800 cursor-pointer">
          Stay anonymous to this restaurant
        </label>
        <p className="text-sm text-gray-600 mt-1">
          Your name will not be shared with the restaurant. The system will still collect your details for order processing.
        </p>
      </div>
    </div>
  )
}