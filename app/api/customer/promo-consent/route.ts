/**
 * PATCH /api/customer/promo-consent
 *
 * Upserts a customer_promo_consent row for a specific venue.
 * Used to upgrade a customer's consent scope from 'at_venue_only' to 'always'
 * — meaning they want to receive outbound promos from this venue even when
 * they're not connected (not on an active tab).
 *
 * Body: {
 *   customerId?: string   — customer row ID (authenticated users)
 *   deviceId?: string     — device identifier (anonymous users, fallback anchor)
 *   barId: string         — venue ID
 *   scope: 'always' | 'at_venue_only' | 'never'
 * }
 * Exactly one of customerId | deviceId is required.
 *
 * GET /api/customer/promo-consent?customerId=xxx&barId=yyy
 *   or  ?deviceId=xxx&barId=yyy
 * Returns the current consent row for the customer/device + venue pair, or null.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

const VALID_SCOPES = ['always', 'at_venue_only', 'never'] as const;
type ConsentScope = typeof VALID_SCOPES[number];

const SELECT_COLS = 'id, customer_id, device_id, bar_id, scope, consented_at, updated_at';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const deviceId = searchParams.get('deviceId');
    const barId = searchParams.get('barId');

    if (!barId || (!customerId && !deviceId)) {
      return NextResponse.json(
        { error: 'barId and one of customerId | deviceId are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const baseQuery = (supabase as any)
      .from('customer_promo_consent')
      .select(SELECT_COLS)
      .eq('bar_id', barId);

    const query = customerId
      ? baseQuery.eq('customer_id', customerId)
      : baseQuery.eq('device_id', deviceId);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[promo-consent GET]', error);
      return NextResponse.json({ error: 'Failed to fetch consent' }, { status: 500 });
    }

    return NextResponse.json({ consent: data ?? null });
  } catch (err) {
    console.error('[promo-consent GET] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, deviceId, barId, scope } = body;

    if (!barId || (!customerId && !deviceId)) {
      return NextResponse.json(
        { error: 'barId and one of customerId | deviceId are required' },
        { status: 400 }
      );
    }

    if (!VALID_SCOPES.includes(scope as ConsentScope)) {
      return NextResponse.json(
        { error: `scope must be one of: ${VALID_SCOPES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const withdrawnAt = scope === 'never' ? new Date().toISOString() : null;

    let data;

    if (customerId) {
      const { data: d, error } = await (supabase as any)
        .from('customer_promo_consent')
        .upsert(
          { customer_id: customerId, bar_id: barId, scope, withdrawn_at: withdrawnAt },
          { onConflict: 'customer_id,bar_id' },
        )
        .select(SELECT_COLS)
        .single();
      if (error) {
        console.error('[promo-consent PATCH]', error);
        return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
      }
      data = d;
    } else {
      // Anonymous / device-anchored consent. The table's unique index is on
      // (customer_id, bar_id) — customer_id is NULL here, so Postgres treats
      // every device row as distinct. Do a manual update-or-insert to avoid
      // duplicate rows for the same device + venue.
      const { data: existing } = await (supabase as any)
        .from('customer_promo_consent')
        .select('id')
        .eq('device_id', deviceId)
        .eq('bar_id', barId)
        .maybeSingle();

      let result;
      if (existing?.id) {
        result = await (supabase as any)
          .from('customer_promo_consent')
          .update({ scope, withdrawn_at: withdrawnAt })
          .eq('id', existing.id)
          .select(SELECT_COLS)
          .single();
      } else {
        result = await (supabase as any)
          .from('customer_promo_consent')
          .insert({ device_id: deviceId, bar_id: barId, scope, withdrawn_at: withdrawnAt })
          .select(SELECT_COLS)
          .single();
      }

      if (result.error) {
        console.error('[promo-consent PATCH device]', result.error);
        return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
      }
      data = result.data;
    }

    return NextResponse.json({ consent: data });
  } catch (err) {
    console.error('[promo-consent PATCH] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
