/**
 * GET /api/tabs/:id/payments
 * Returns all payments for a tab using the service role client to bypass RLS.
 * Same pattern as /api/tabs/:id/orders.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Tab ID is required' }, { status: 400 });
    }

    const db = createServiceRoleClient();

    const { data: payments, error } = await db
      .from('tab_payments')
      .select('*')
      .eq('tab_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tab payments GET]', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json({ payments: payments ?? [] });
  } catch (err) {
    console.error('[tab payments GET] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
