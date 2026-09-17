// app/api/auth/roles/route.ts
// Detects which Tabeza platforms the authenticated user has access to.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export interface UserRole {
  type: 'staff' | 'crew' | 'customer' | 'tabeza'
  label: string
  description: string
  url: string
  barName?: string
}

export interface RolesResponse {
  roles: UserRole[]
  userId: string
}

async function getUserId(req: NextRequest): Promise<string | null> {
  // Bearer token only — @supabase/ssr is not installed in this app.
  // The login page always sends the access token as a Bearer header.
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const db = createServiceRoleClient()
    const { data: { user } } = await db.auth.getUser(token)
    if (user) return user.id
  }
  return null
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceRoleClient()

  const adminUrl    = process.env.NEXT_PUBLIC_ADMIN_APP_URL       || 'https://admin.tabeza.co.ke'
  const staffUrl    = process.env.NEXT_PUBLIC_STAFF_APP_URL       || 'https://tabeza.co.ke'
  const crewUrl     = process.env.NEXT_PUBLIC_CREW_APP_URL       || 'https://crew.tabeza.co.ke'
  const customerUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL   || process.env.NEXT_PUBLIC_APP_URL || 'https://app.tabeza.co.ke'

  const roles: UserRole[] = []

  // ── Super-admin ────────────────────────────────────────────────────────
  const { data: adminRow } = await db
    .from('tabeza_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (adminRow) {
    roles.push({
      type: 'tabeza',
      label: 'Tabeza HQ',
      description: 'Platform owner — full system access',
      url: `${adminUrl}/system`,
    })
  }

  // ── Venue manager (user_bars) ──────────────────────────────────────────
  // Portal users (bar_extensions: brand_owner / crew_agency) are NOT venue
  // managers here — the extension-aware logic mirrors tabeza-staff so only
  // plain venue members get a "Venue Manager" card.
  const { data: userBarRows } = await db
    .from('user_bars')
    .select('bar_id, role, bars(name)')
    .eq('user_id', userId)
    .limit(20)

  if (userBarRows && userBarRows.length > 0) {
    const barIds = userBarRows.map((r: any) => r.bar_id)

    const { data: extRows } = await (db as any)
      .from('bar_extensions')
      .select('bar_id, extension_type')
      .in('bar_id', barIds)

    const extensionsByBar = new Map<string, Set<string>>()
    for (const e of extRows || []) {
      if (!extensionsByBar.has(e.bar_id)) extensionsByBar.set(e.bar_id, new Set())
      extensionsByBar.get(e.bar_id)!.add(e.extension_type)
    }

    const emittedTypes = new Set<string>()

    for (const row of userBarRows) {
      const bar = row.bars as any
      const exts = extensionsByBar.get(row.bar_id) ?? new Set<string>()

      if (exts.size === 0 && !emittedTypes.has('venue')) {
        emittedTypes.add('venue')
        roles.push({
          type: 'staff',
          label: 'Venue Manager',
          description: bar?.name ? `Manage ${bar.name}` : 'Manage your venue',
          url: staffUrl,
          barName: bar?.name,
        })
      }
    }
  }

  // ── Waiter / crew (crew_members) ─────────────────────────────────────
  const { data: staffMemberRow } = await (db as any)
    .from('crew_members')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (staffMemberRow) {
    roles.push({
      type: 'crew',
      label: 'Waiter',
      description: 'Find shifts and manage your work',
      url: `${crewUrl}/waiter`,
    })
  }

  // ── Customer (consent_records) ─────────────────────────────────────────
  const { data: consentRow } = await db
    .from('consent_records')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (consentRow) {
    roles.push({
      type: 'customer',
      label: 'Customer',
      description: 'View your tabs and orders',
      url: `${customerUrl}/start`,
    })
  }

  return NextResponse.json({ roles, userId } satisfies RolesResponse)
}
