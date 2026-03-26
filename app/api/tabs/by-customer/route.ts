/**
 * GET /api/tabs/by-customer?customerId=...&barId=...
 *
 * Finds an open or overdue tab for a given customer at a given bar.
 * Uses the service role client to bypass RLS.
 * This replaces the legacy device-based hasOpenTabAtBar lookup now that
 * customers are always authenticated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const barId = searchParams.get('barId');

    if (!customerId || !barId) {
      return NextResponse.json(
        { error: 'customerId and barId are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: tab, error } = await supabase
      .from('tabs')
      .select('*')
      .eq('bar_id', barId)
      .eq('customer_id', customerId)
      .in('status', ['open', 'overdue'])
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching tab by customer:', error);
      return NextResponse.json({ error: 'Failed to fetch tab' }, { status: 500 });
    }

    return NextResponse.json({ tab: tab ?? null });
  } catch (error) {
    console.error('❌ Unhandled error in by-customer tab fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
