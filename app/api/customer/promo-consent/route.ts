/**
 * PATCH /api/customer/promo-consent
 *
 * Upserts a customer_promo_consent row for a specific venue.
 * Used to upgrade a customer's consent scope from 'at_venue_only' to 'always'
 * — meaning they want to receive outbound promos from this venue even when
 * they're not connected (not on an active tab).
 *
 * Body: {
 *   customerId: string   — customer row ID
 *   barId: string        — venue ID
 *   scope: 'always' | 'at_venue_only' | 'never'
 * }
 *
 * GET /api/customer/promo-consent?customerId=xxx&barId=yyy
 * Returns the current consent row for the customer+venue pair, or null.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

const VALID_SCOPES = ['always', 'at_venue_only', 'never'] as const;
type ConsentScope = typeof VALID_SCOPES[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const barId = searchParams.get('barId');

    if (!customerId || !barId) {
      return NextResponse.json({ error: 'customerId and barId are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await (supabase as any)
      .from('customer_promo_consent')
      .select('id, customer_id, bar_id, scope, created_at, updated_at')
      .eq('customer_id', customerId)
      .eq('bar_id', barId)
      .maybeSingle();

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
    const { customerId, barId, scope } = body;

    if (!customerId || !barId) {
      return NextResponse.json(
        { error: 'customerId and barId are required' },
        { status: 400 },
      );
    }

    if (!VALID_SCOPES.includes(scope as ConsentScope)) {
      return NextResponse.json(
        { error: `scope must be one of: ${VALID_SCOPES.join(', ')}` },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await (supabase as any)
      .from('customer_promo_consent')
      .upsert(
        {
          customer_id: customerId,
          bar_id: barId,
          scope,
          // Clear withdrawn_at if they're re-opting in
          withdrawn_at: scope === 'never' ? new Date().toISOString() : null,
        },
        { onConflict: 'customer_id,bar_id' },

      )
      .select('id, customer_id, bar_id, scope, created_at, updated_at')
      .single();

    if (error) {
      console.error('[promo-consent PATCH]', error);
      return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
    }

    return NextResponse.json({ consent: data });
  } catch (err) {
    console.error('[promo-consent PATCH] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
