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

/**
 * POST /api/tabs/[id]/orders
 * Body: { items: OrderItem[], total: number, initiated_by?: string }
 *
 * Creates a new order for a tab using the service-role client to bypass RLS.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tabId } = await params;
    const body = await request.json();
    const { items, total, initiated_by = 'customer' } = body;

    if (!tabId || !items || total === undefined) {
      return NextResponse.json({ error: 'tabId, items and total are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: order, error } = await supabase
      .from('tab_orders')
      .insert({
        tab_id: tabId,
        items,
        total,
        status: 'pending',
        initiated_by,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating order:', error);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('❌ Unhandled error in order create:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/tabs/[id]/orders
 * Body: { orderId: string, status: 'confirmed' | 'cancelled', rejectionReason?: string }
 *
 * Updates a single order's status using the service-role client to bypass RLS.
 * Used by the customer to approve or reject staff-initiated orders.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tabId } = await params;
    const body = await request.json();
    const { orderId, status, rejectionReason } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    if (!['confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'status must be confirmed or cancelled' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const updates: Record<string, any> = { status };
    if (status === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    }
    if (status === 'cancelled' && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    const { data: updatedOrder, error } = await supabase
      .from('tab_orders')
      .update(updates)
      .eq('id', orderId)
      .eq('tab_id', tabId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('❌ Unhandled error in order update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
