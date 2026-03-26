/**
 * PATCH /api/tabs/update-notes
 *
 * Merges a partial notes object into the tab's existing notes JSON.
 * Uses the service role client to bypass RLS.
 * Used for saving table number and other customer-set tab metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const { tabId, notes: partialNotes } = await request.json();

    if (!tabId || typeof partialNotes !== 'object') {
      return NextResponse.json(
        { error: 'tabId and notes object are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch current notes first
    const { data: tab, error: fetchError } = await supabase
      .from('tabs')
      .select('notes')
      .eq('id', tabId)
      .single();

    if (fetchError || !tab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    let currentNotes: Record<string, any> = {};
    try {
      currentNotes = JSON.parse((tab as any).notes || '{}');
    } catch {
      currentNotes = {};
    }

    const updatedNotes = { ...currentNotes, ...partialNotes };

    const { error: updateError } = await supabase
      .from('tabs')
      .update({ notes: JSON.stringify(updatedNotes) })
      .eq('id', tabId);

    if (updateError) {
      console.error('❌ Error updating tab notes:', updateError);
      return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notes: updatedNotes });
  } catch (error) {
    console.error('❌ Unhandled error in update-notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
