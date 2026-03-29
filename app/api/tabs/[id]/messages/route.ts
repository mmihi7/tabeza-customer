/**
 * GET /api/tabs/[id]/messages
 *
 * Fetches all telegram messages for a tab using the service role client to bypass RLS.
 * The browser-side publishable key is blocked by RLS on `tab_telegram_messages`,
 * causing staff-sent messages to be invisible until the customer refreshes.
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

    const { data: messages, error } = await supabase
      .from('tab_telegram_messages')
      .select(`
        *,
        tab:tabs(
          bar_id,
          bars(id, name)
        )
      `)
      .eq('tab_id', tabId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error fetching tab messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('❌ Unhandled error in tab messages fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
