/**
 * GET /api/tabs/[id]/orders
 *
 * Fetches all orders for a tab using the service role client to bypass RLS.
 * This route exists because the browser-side publishable key is blocked by
 * Row Level Security on `tab_orders`, causing staff-initiated orders to be
 * invisible on the customer menu page.
 *
 * Mirrors the pattern in /api/tabs/[id]/route.ts exactly.
 *
 * Bug_Condition: isBugCondition({ client: supabase, table: 'tab_orders', key: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY })
 * Expected_Behavior: GET /api/tabs/{tabId}/orders returns complete order list including initiated_by: 'staff' rows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tabId } = await params;

    if (!tabId || typeof tabId !== 'string') {
      return NextResponse.json({ error: 'Invalid tab ID' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: orders, error } = await supabase
      .from('tab_orders')
      .select('*')
      .eq('tab_id', tabId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tab orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('❌ Unhandled error in tab orders fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
