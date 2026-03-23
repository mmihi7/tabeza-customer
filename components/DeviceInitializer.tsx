'use client'

import { useEffect } from 'react'

export default function DeviceInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize device identity and other setup
    console.log('Device initialized')
  }, [])

  return <>{children}</>
}
