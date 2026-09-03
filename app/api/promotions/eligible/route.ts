/**
 * GET /api/promotions/eligible
 *
 * Returns live promotions the customer is currently eligible for at a venue,
 * computed by the DB function get_eligible_promotions() (which derives visit
 * and spend tiers from venue_visit_tracking — live data).
 *
 * Requires a known (linked/authenticated) customer — anonymous/device-only
 * tabs return an empty list.
 *
 * Results are cached for 30s (Redis, TTL 30s) and invalidated on redemption.
 *
 * Query: ?customerId=xxx&barId=yyy&tabId=zzz
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getCachedOrFetch } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const barId = searchParams.get('barId');
    const tabId = searchParams.get('tabId');

    if (!customerId || !barId || !tabId) {
      return NextResponse.json(
        { error: 'customerId, barId, and tabId are all required' },
        { status: 400 }
      );
    }

    const cacheKey = `promotions:eligible:${barId}:${customerId}:${tabId}`;

    const promotions = await getCachedOrFetch(cacheKey, 30, async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await (supabase as any).rpc('get_eligible_promotions', {
        p_customer_id: customerId,
        p_bar_id: barId,
        p_tab_id: tabId,
      });

      if (error) {
        console.error('[promotions/eligible rpc]', error);
        throw error;
      }

      return data ?? [];
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('[promotions/eligible] unhandled', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
