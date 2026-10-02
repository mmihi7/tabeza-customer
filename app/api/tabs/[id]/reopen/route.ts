/**
 * PATCH /api/tabs/[id]/reopen
 *
 * Reopens an overdue tab by updating its status from 'overdue' to 'open'.
 * Uses the service-role client to bypass RLS.
 *
 * Idempotency guard: returns 400 if the tab is not currently 'overdue'.
 * Returns 404 if the tab does not exist.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { enforceVenueOpen, refusalResponse } from '@/lib/services/tab-hours';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tabId } = await params;

    if (!tabId || typeof tabId !== 'string') {
      return NextResponse.json({ error: 'Invalid tab ID' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Fetch the tab to validate current status
    const { data: tab, error: fetchError } = await supabase
      .from('tabs')
      .select('id, status, bar_id')
      .eq('id', tabId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching tab for reopen:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch tab' }, { status: 500 });
    }

    if (!tab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    // Idempotency guard — only overdue tabs can be reopened
    if (tab.status !== 'overdue') {
      return NextResponse.json({ error: 'Tab is not overdue' }, { status: 400 });
    }

    /* Server-side business-hours gate. Reopening revives an overdue tab, so it
       is just as capable of serving a closed venue as creating a new one. The
       tab is already known here, so there is no active-tab lookup to do — but
       the gate is the same shared one, and a failed hours query stays a 503
       rather than being mistaken for "closed". */
    const decision = await enforceVenueOpen(supabase, tab.bar_id, { tabId: tab.id });
    const refusal = refusalResponse(decision);
    if (refusal) return refusal;

    // Update status from 'overdue' to 'open'
    const { data: updatedTab, error: updateError } = await supabase
      .from('tabs')
      .update({ status: 'open' })
      .eq('id', tabId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error reopening tab:', updateError);
      return NextResponse.json({ error: 'Failed to reopen tab' }, { status: 500 });
    }

    console.log('✅ Tab reopened successfully:', tabId);

    return NextResponse.json({ tab: updatedTab });
  } catch (error) {
    console.error('❌ Unhandled error in tab reopen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
