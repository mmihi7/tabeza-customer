/**
 * GET /api/loyalty/venue-discounts/:bar_id
 * Public route — returns the venue's spend-tier % rewards and visit-frequency bonuses.
 * No auth required; discount percentages are not sensitive.
 * Falls back to system minimums if no record exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

const DEFAULTS = {
  spend_tiers:  { bronze: 1.5, silver: 3.0, gold: 5.0 },
  visit_bonuses: { once_per_week: 1.0, twice_per_week: 2.0, thrice_per_week: 3.0 },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bar_id: string }> }
) {
  try {
    const { bar_id } = await params;

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id is required' }, { status: 400 });
    }

    const db = createServiceRoleClient();
    const { data, error } = await db
      .from('venue_discount_settings')
      .select('spend_tiers, visit_bonuses')
      .eq('bar_id', bar_id)
      .maybeSingle();

    if (error) {
      console.error('[venue-discounts customer GET]', error);
      return NextResponse.json(DEFAULTS);
    }

    return NextResponse.json(data ?? DEFAULTS);
  } catch (err) {
    console.error('[venue-discounts customer GET] unhandled', err);
    return NextResponse.json(DEFAULTS);
  }
}
