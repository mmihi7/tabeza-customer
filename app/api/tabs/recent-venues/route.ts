/**
 * GET /api/tabs/recent-venues?customerId=xxx or ?deviceIdentifier=xxx
 * Returns the 5 most recently visited venues for a customer.
 * Accepts either customerId (authenticated) or deviceIdentifier (anonymous).
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
    const deviceIdentifier = searchParams.get('deviceIdentifier');

    if (!customerId && !deviceIdentifier) {
      return NextResponse.json({ error: 'customerId or deviceIdentifier is required' }, { status: 400 });
    }

    const cacheKey = `recent_venues:${customerId ?? ''}:${deviceIdentifier ?? ''}`;

    const result = await getCachedOrFetch(cacheKey, CACHE_TTL_S, async () => {
      const db = createServiceRoleClient();

      let query = db
        .from('tabs')
        .select('bar_id, opened_at, bars(id, name, slug, category)')
        .order('opened_at', { ascending: false })
        .limit(50);

      // Match by whichever identifiers are available. Passing both covers the
      // case where a tab was opened anonymously (device) before the customer
      // signed in (customer_id) — venues show either way.
      if (customerId && deviceIdentifier) {
        query = query.or(`customer_id.eq.${customerId},device_identifier.eq.${deviceIdentifier}`);
      } else if (customerId) {
        query = query.eq('customer_id', customerId);
      } else {
        query = query.eq('device_identifier', deviceIdentifier!);
      }

      const { data, error } = await query;

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