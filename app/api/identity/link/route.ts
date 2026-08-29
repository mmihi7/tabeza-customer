import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth-server'

/**
 * POST /api/identity/link
 *
 * Body: { deviceId, otherUserId, acknowledge: true }
 *
 * Links the current customer's auth user to another auth user that has used
 * the same device. The link is written by the service role (RLS allows no
 * direct public writes on customer_account_links) and requires explicit
 * `acknowledge: true` — the customer confirms that unpaid liabilities in one
 * linked account are visible across both and may be pursued for a legal claim.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { deviceId?: string; otherUserId?: string; acknowledge?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { deviceId, otherUserId, acknowledge } = body
  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
  }
  if (!otherUserId || otherUserId === user.id) {
    return NextResponse.json({ error: 'otherUserId is required and must differ from the current user' }, { status: 400 })
  }
  if (acknowledge !== true) {
    return NextResponse.json(
      { error: 'Liability acknowledgement is required before accounts can be linked.' },
      { status: 422 }
    )
  }

  const supabase = createServiceRoleClient()
  const db = supabase as any

  // Confirm the other user has actually used this device before linking.
  const { data: tabCustomers, error: tabErr } = await db
    .from('tabs')
    .select('customer_id')
    .eq('device_identifier', deviceId)
    .eq('customer_id', otherUserId)
    .limit(1)

  if (tabErr) {
    console.error('[identity link] tabs query failed', tabErr)
    return NextResponse.json({ error: 'Failed to verify device history' }, { status: 500 })
  }
  if ((tabCustomers ?? []).length === 0) {
    return NextResponse.json(
      { error: 'The other account has no tabs on this device.' },
      { status: 409 }
    )
  }

  const least = [user.id, otherUserId].sort()[0]
  const greatest = [user.id, otherUserId].sort()[1]

  const { data: existingRows, error: readErr } = await db
    .from('customer_account_links')
    .select('*')
    .or('primary_customer_id.in.( ' + [user.id, otherUserId].join(',') + '),linked_customer_id.in.(' + [user.id, otherUserId].join(',') + ')')

  if (readErr) {
    console.error('[identity link] existing link query failed', readErr)
    return NextResponse.json({ error: 'Failed to read link state' }, { status: 500 })
  }

  const existingPair = (existingRows ?? []).find((l: any) =>
    [l.primary_customer_id, l.linked_customer_id].sort().join(',') === `${least},${greatest}`
  )

  const record = {
    primary_customer_id: least,
    linked_customer_id: greatest,
    device_identifier: deviceId,
    status: 'linked',
    liability_acknowledged: true,
    acknowledged_at: new Date().toISOString(),
    initiated_by: 'customer',
  }

  let result: any
  if (existingPair) {
    const { data, error } = await db
      .from('customer_account_links')
      .update(record)
      .eq('id', existingPair.id)
      .select()
      .single()
    result = { data, error }
  } else {
    const { data, error } = await db
      .from('customer_account_links')
      .insert(record)
      .select()
      .single()
    result = { data, error }
  }

  if (result.error) {
    console.error('[identity link] write failed', result.error)
    return NextResponse.json({ error: 'Failed to link accounts' }, { status: 500 })
  }

  return NextResponse.json({
    linked: {
      id: result.data.id,
      otherUserId,
      status: result.data.status,
      liabilityAcknowledged: result.data.liability_acknowledged,
      acknowledgedAt: result.data.acknowledged_at,
    },
  })
}