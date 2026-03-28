import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        storageKey: 'tabeza-customer-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  }
  return supabaseInstance
})()

// Server-side client using secret key for API routes
export const createServiceRoleClient = () => {
  // Support both legacy JWT service_role key and new sb_secret_ format
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SERVICE_ROLE_KEY
  if (!secretKey) {
    throw new Error('SUPABASE_SECRET_KEY is not configured')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
