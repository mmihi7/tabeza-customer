/**
 * GET /api/tabs/overdue?customerId=xxx or ?deviceIdentifier=xxx
 * Returns the most recent overdue tab for a customer (joined with bar + balance).
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

    const cacheKey = `overdue_tab:${customerId ?? ''}:${deviceIdentifier ?? ''}`;

    const result = await getCachedOrFetch(cacheKey, CACHE_TTL_S, async () => {
      const db = createServiceRoleClient();

      let query = db
        .from('tabs')
        .select('id, status, bar_id, opened_at, moved_to_overdue_at, overdue_reason, bars(id, name, slug)')
        .eq('status', 'overdue')
        .order('moved_to_overdue_at', { ascending: false })
        .limit(1);

      if (customerId && deviceIdentifier) {
        query = query.or(`customer_id.eq.${customerId},device_identifier.eq.${deviceIdentifier}`);
      } else if (customerId) {
        query = query.eq('customer_id', customerId);
      } else {
        query = query.eq('device_identifier', deviceIdentifier!);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[overdue]', error);
        return null;
      }

      const tab = (data ?? [])[0];
      if (!tab) return null;

      const { data: balanceData, error: balanceError } = await db
        .from('tab_balances')
        .select('balance')
        .eq('tab_id', tab.id)
        .single();

      if (!balanceError && balanceData) {
        (tab as any).balance = balanceData.balance;
      }

      return tab;
    });

    return NextResponse.json({ tab: result ?? null });
  } catch (err) {
    console.error('[overdue] unhandled', err);
    return NextResponse.json({ tab: null });
  }
}