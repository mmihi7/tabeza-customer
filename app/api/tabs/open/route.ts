/**
 * GET /api/tabs/open
 *
 * Returns all open tabs for a bar. Used by Captain's Orders to list
 * tabs available for receipt assignment.
 *
 * CORE TRUTH: Manual service always exists. Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    if (!barId) {
      return NextResponse.json(
        { error: 'barId is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: tabs, error } = await supabase
      .from('tabs')
      .select('id, tab_number, opened_at, notes')
      .eq('bar_id', barId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false });

    if (error) {
      console.error('Error fetching open tabs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch open tabs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tabs: tabs || [] });
  } catch (error) {
    console.error('Unhandled error in open tabs endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
