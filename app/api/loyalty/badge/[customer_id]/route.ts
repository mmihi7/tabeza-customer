import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params;
    const supabase = createServiceRoleClient();

    // Query customer_badges table for the highest active badge
    // Badge levels are ordered: platinum > gold > silver > bronze
    const { data, error } = await supabase
      .from('customer_badges')
      .select(`
        badge_level,
        awarded_at,
        earned_at_bar_id,
        spend_amount_at_venue,
        bars:earned_at_bar_id (name)
      `)
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .order('badge_level', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching customer badge:', error);
      return NextResponse.json(
        { error: 'Failed to fetch badge' },
        { status: 500 }
      );
    }

    // No badge case - return null badge_level
    if (!data) {
      return NextResponse.json({ badge_level: null });
    }

    // Extract venue name from the joined bars table
    const venueName = Array.isArray(data.bars)
      ? (data.bars[0]?.name ?? 'Unknown Venue')
      : ((data.bars as { name: string } | null)?.name ?? 'Unknown Venue');

    return NextResponse.json({
      badge_level: data.badge_level,
      awarded_at: data.awarded_at,
      earned_at_bar_id: data.earned_at_bar_id,
      earned_at_bar_name: venueName,
      spend_amount_at_venue: data.spend_amount_at_venue,
    });
  } catch (error) {
    console.error('Error in badge GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
