// hooks/usePlatformSettings.ts
// Reads platform feature flags from the public /api/platform/settings endpoint
// (which reads via service-role client — platform_settings RLS blocks anon reads).
// Cached in module scope — one fetch per app load, silently refreshes every 5 min.
// All flags default to TRUE so the UI is never accidentally hidden on fetch failure.

import { useEffect, useState } from 'react'

export interface PlatformFlags {
  early_access_enabled: boolean
  maintenance_mode: boolean
  crew_marketplace_enabled: boolean
  pos_printer_enabled: boolean
  global_products_enabled: boolean
  customer_ordering_enabled: boolean
  loyalty_enabled: boolean
  promotions_ai_enabled: boolean
  media_system_enabled: boolean
  mpesa_enabled: boolean
  webhooks_enabled: boolean
  admob_ads_enabled: boolean
  meta_ads_enabled: boolean
}

const DEFAULTS: PlatformFlags = {
  early_access_enabled: true,
  maintenance_mode: false,
  crew_marketplace_enabled: true,
  pos_printer_enabled: true,
  global_products_enabled: true,
  customer_ordering_enabled: true,
  loyalty_enabled: true,
  promotions_ai_enabled: false,
  media_system_enabled: true,
  mpesa_enabled: true,
  webhooks_enabled: true,
  admob_ads_enabled: false,
  meta_ads_enabled: false,
}

// Module-level cache so the hook doesn't refetch on every re-render
let cachedFlags: PlatformFlags | null = null
let lastFetch = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function fetchFlags(): Promise<PlatformFlags> {
  try {
    const res = await fetch('/api/platform/settings', { cache: 'no-store' })
    if (!res.ok) return { ...DEFAULTS }
    const data = await res.json()
    return { ...DEFAULTS, ...data }
  } catch {
    return { ...DEFAULTS }
  }
}

export function usePlatformSettings(): { flags: PlatformFlags; loading: boolean } {
  const [flags, setFlags] = useState<PlatformFlags>(cachedFlags ?? DEFAULTS)
  const [loading, setLoading] = useState(!cachedFlags)

  useEffect(() => {
    const now = Date.now()
    if (cachedFlags && now - lastFetch < CACHE_TTL_MS) {
      setFlags(cachedFlags)
      setLoading(false)
      return
    }

    fetchFlags().then(fresh => {
      cachedFlags = fresh
      lastFetch = Date.now()
      setFlags(fresh)
      setLoading(false)
    })
  }, [])

  return { flags, loading }
}
