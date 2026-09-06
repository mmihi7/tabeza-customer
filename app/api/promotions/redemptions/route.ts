/**
 * GET /api/promotions/redemptions
 *
 * Returns the promos already redeemed on a given tab, for the Activity Log
 * notice board. Each entry is a passive summary row ({ name, redeemed_at,
 * discount_applied }) — redemption itself never happens through this route.
 *
 * Requires a tabId. Uses the service-role client because promotion_redemptions
 * is service-role-only under RLS.
 *
 * Query: ?tabId=zzz
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tabId = searchParams.get('tabId');

    if (!tabId) {
      return NextResponse.json({ error: 'tabId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase as any)
      .from('promotion_redemptions')
      .select('id, redeemed_at, discount_applied, promotions(id, name, type_config)')
      .eq('tab_id', tabId)
      .order('redeemed_at', { ascending: false });

    if (error) {
      console.error('[promotions/redemptions]', error);
      return NextResponse.json({ error: 'Failed to load redemptions' }, { status: 500 });
    }

    const redemptions = (data ?? []).map((r: any) => ({
      id: r.id,
      redeemed_at: r.redeemed_at,
      discount_applied: r.discount_applied,
      name: r.promotions?.name ?? 'Promotion',
      percentage:
        r.promotions?.type_config && typeof r.promotions.type_config.percentage === 'number'
          ? r.promotions.type_config.percentage
          : null,
    }));

    return NextResponse.json({ redemptions });
  } catch (error) {
    console.error('[promotions/redemptions] unhandled', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
