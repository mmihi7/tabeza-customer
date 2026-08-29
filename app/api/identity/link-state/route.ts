import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth-server'

/**
 * GET /api/identity/link-state?deviceId=xxx
 *
 * Returns whether the current customer's device has produced tabs under a
 * DIFFERENT auth user. The device is the stable identity — when the same
 * device is used by two different emails, the customer is asked to LINK the
 * two accounts so unpaid liabilities follow them across emails.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deviceId = new URL(req.url).searchParams.get('deviceId')
  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const db = supabase as any

  // 1. Distinct customer/auth users who have opened tabs on this device,
  //    excluding the current user.
  const { data: tabCustomers, error: tabErr } = await db
    .from('tabs')
    .select('customer_id')
    .eq('device_identifier', deviceId)
    .not('customer_id', 'is', null)
    .limit(1000)

  if (tabErr) {
    console.error('[identity link-state] tabs query failed', tabErr)
    return NextResponse.json({ error: 'Failed to load identity state' }, { status: 500 })
  }

  const otherUserIds = Array.from(
    new Set<string>(
      (tabCustomers ?? [])
        .map((t: any) => t.customer_id as string)
        .filter((id: string) => id && id !== user.id)
    )
  )

  // 2. Resolve display names for the other accounts from the customers profile.
  const otherAccounts: { userId: string; displayName: string | null }[] = []
  if (otherUserIds.length > 0) {
    const { data: profiles, error: profErr } = await db
      .from('customers')
      .select('id, full_name, display_name, avatar_url')
      .in('id', otherUserIds)

    if (!profErr) {
      for (const id of otherUserIds) {
        const profile = (profiles ?? []).find((p: any) => p.id === id)
        const displayName =
          profile?.display_name || profile?.full_name || null
        otherAccounts.push({ userId: id, displayName })
      }
    }
  }

  // 3. Existing links on this device that involve the current user.
  const { data: myLinks, error: linkErr } = await db
    .from('customer_account_links')
    .select('*')
    .eq('device_identifier', deviceId)
    .eq('status', 'linked')

  if (linkErr) {
    console.error('[identity link-state] links query failed', linkErr)
    return NextResponse.json({ error: 'Failed to load identity state' }, { status: 500 })
  }

  const activeLinks = (myLinks ?? []).filter(
    (l: any) => l.primary_customer_id === user.id || l.linked_customer_id === user.id
  )
  const linkedOtherIds = new Set(
    activeLinks.map((l: any) =>
      l.primary_customer_id === user.id ? l.linked_customer_id : l.primary_customer_id
    )
  )

  const promptableAccounts = otherAccounts.filter((a) => !linkedOtherIds.has(a.userId))

  return NextResponse.json({
    deviceId,
    otherAccounts,
    activeLink:
      activeLinks.length > 0
        ? {
            otherUserId: activeLinks[0].primary_customer_id === user.id
              ? activeLinks[0].linked_customer_id
              : activeLinks[0].primary_customer_id,
            liabilityAcknowledged: activeLinks[0].liability_acknowledged,
            acknowledgedAt: activeLinks[0].acknowledged_at,
          }
        : null,
    promptable: promptableAccounts.length > 0,
  })
}