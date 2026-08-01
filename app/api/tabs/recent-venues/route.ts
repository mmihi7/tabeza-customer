/**
 * GET /api/tabs/recent-venues?customerId=xxx
 * Returns the 5 most recently visited venues for a customer.
 * Uses service role to bypass RLS on the tabs table.
 * Cached in Redis (TTL 120s).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getCachedOrFetch } from '@/lib/cache';

const CACHE_TTL_S = 120;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const cacheKey = `recent_venues:${customerId}`;

    const result = await getCachedOrFetch(cacheKey, CACHE_TTL_S, async () => {
      const db = createServiceRoleClient();
      const { data, error } = await db
        .from('tabs')
        .select('bar_id, opened_at, bars(id, name, slug, category)')
        .eq('customer_id', customerId)
        .order('opened_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[recent-venues]', error);
        return [];
      }

      return data ?? [];
    });

    return NextResponse.json({ tabs: result });
  } catch (err) {
    console.error('[recent-venues] unhandled', err);
    return NextResponse.json({ tabs: [] });
  }
}