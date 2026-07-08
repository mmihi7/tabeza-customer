/**
 * GET /api/tabs/[id]
 *
 * Fetches a single tab by ID with its associated bar data.
 * Uses the service role client to bypass RLS — the caller is responsible
 * for ensuring the tab ID came from a trusted source (sessionStorage set
 * during authenticated tab creation).
 *
 * CORE TRUTH: Manual service always exists. Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
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

    const { data: tab, error } = await supabase
      .from('tabs')
      .select(`
        *,
        bar:bars(id, name, location),
        crew_member:crew_members(id, display_name, face_photo_url, face_thumbnail_url)
      `)
      .eq('id', tabId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching tab:', error);
      return NextResponse.json({ error: 'Failed to fetch tab' }, { status: 500 });
    }

    if (!tab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    return NextResponse.json({ tab });
  } catch (error) {
    console.error('❌ Unhandled error in tab fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
