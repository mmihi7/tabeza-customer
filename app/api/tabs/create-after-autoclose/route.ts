/**
 * Create New Tab After Auto-Close API
 * Handles creation of new tab after overdue tab was auto-closed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { decideTabCreation, refusalResponse } from '@/lib/services/tab-hours';

export async function POST(request: NextRequest) {
  try {
    const { barId, ownerIdentifier, deviceId } = await request.json();

    if (!barId || !ownerIdentifier) {
      return NextResponse.json(
        { error: 'Bar ID and owner identifier are required' },
        { status: 400 }
      );
    }

    console.log('🆕 Creating new tab after auto-close:', { barId, ownerIdentifier });

    const supabase = createServiceRoleClient();

    /* Tab access decision: existing-tab lookup FIRST, then the authoritative
       business-hours gate. The order is enforced inside `decideTabCreation` —
       an existing open/closing tab must stay usable even after the venue
       shuts, so the lookup cannot come after the gate. */
    const decision = await decideTabCreation(supabase, { barId, ownerIdentifier });
    const refusal = refusalResponse(decision);
    if (refusal) return refusal;

    // Get the next tab number for this bar
    const { data: maxTabData, error: maxTabError } = await supabase
      .from('tabs')
      .select('tab_number')
      .eq('bar_id', barId)
      .order('tab_number', { ascending: false })
      .limit(1);

    if (maxTabError) {
      console.error('❌ Error getting max tab number:', maxTabError);
      return NextResponse.json(
        { error: 'Failed to determine tab number' },
        { status: 500 }
      );
    }

    const nextTabNumber = (maxTabData && maxTabData.length > 0) 
      ? (maxTabData[0].tab_number ?? 0) + 1 
      : 1;

    // Create the new tab
    const { data: newTab, error: createError } = await (supabase as any)
      .from('tabs')
      .insert({
        bar_id: barId,
        owner_identifier: ownerIdentifier,
        device_identifier: deviceId,
        tab_number: nextTabNumber,
        status: 'open',
        opened_at: new Date().toISOString(),
        notes: JSON.stringify({
          created_via: 'auto_close_replacement',
          device_id: deviceId,
          created_at_timestamp: Math.floor(Date.now() / 1000),
          previous_tab_auto_closed: true
        })
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating new tab:', createError);
      return NextResponse.json(
        { error: 'Failed to create new tab', details: createError.message },
        { status: 500 }
      );
    }

    console.log('✅ New tab created successfully:', newTab);

    return NextResponse.json({
      success: true,
      message: `New tab ${nextTabNumber} created successfully`,
      tab: {
        id: newTab.id,
        tabNumber: newTab.tab_number,
        barId: newTab.bar_id,
        status: newTab.status,
        openedAt: newTab.opened_at,
        ownerIdentifier: newTab.owner_identifier
      }
    });

  } catch (error: any) {
    console.error('❌ Create tab after auto-close API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}