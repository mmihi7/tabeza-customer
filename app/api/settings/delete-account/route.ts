// POST /api/settings/delete-account
// Deletes the authenticated customer's account and all associated data.
// Requires a JSON body with { confirm: true } as a safety gate.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, getUserFromRequest } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    if (body.confirm !== true) {
      return NextResponse.json({ error: 'Pass { confirm: true } to delete your account' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // 1. Delete the customer record (if it exists)
    await (supabase as any).from('customers').delete().eq('user_id', user.id)

    // 2. Delete push subscriptions for this user
    await (supabase as any).from('push_subscriptions').delete().eq('user_id', user.id)

    // 3. Delete consent records
    await (supabase as any).from('consent_records').delete().eq('user_id', user.id)

    // 4. Delete the auth user (requires service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
    if (authError) {
      console.error('[delete-account] auth delete error:', authError.message)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[delete-account] unexpected error:', msg)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
