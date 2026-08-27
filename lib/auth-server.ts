// lib/auth-server.ts
// Server-only utility for extracting the authenticated user from a request.
// Import this in API routes — never in client components.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SERVICE_ROLE_KEY || ''
  if (!url || !secretKey) return null

  const client = createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null
  return user
}
