import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params;
    const { searchParams } = request.nextUrl;
    const bar_id = searchParams.get('bar_id');

    if (!bar_id) {
      return NextResponse.json(
        { error: 'bar_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();

    // Query completed (closed) tabs for this customer at the specific venue
    // A tab is "completed" when closed_at IS NOT NULL
    const { data: completedTabs, error: tabsError } = await supabaseAdmin
      .from('tabs')
      .select('id, closed_at')
      .eq('customer_id', customer_id)
      .eq('bar_id', bar_id)
      .not('closed_at', 'is', null);

    if (tabsError) {
      console.error('Error querying completed tabs:', tabsError);
      return NextResponse.json(
        { error: 'Failed to fetch loyalty visits data' },
        { status: 500 }
      );
    }

    const completedVisits = completedTabs?.length ?? 0;

    // Calculate total spend from tab_payments for completed tabs
    let totalSpend = 0;
    if (completedTabs && completedTabs.length > 0) {
      const tabIds = completedTabs.map(t => t.id);
      
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('tab_payments')
        .select('amount')
        .in('tab_id', tabIds)
        .eq('status', 'completed');

      if (!paymentsError && payments) {
        totalSpend = payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0')), 0);
      }
    }

    const averageSpend = completedVisits > 0 ? totalSpend / completedVisits : 0;

    // Count visits in the past 7 days for visit frequency bonus
    const { data: recentTabs, error: recentError } = await supabaseAdmin
      .from('tabs')
      .select('id, opened_at')
      .eq('customer_id', customer_id)
      .eq('bar_id', bar_id)
      .gte('opened_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const weeklyVisits = recentError ? 0 : (recentTabs?.length ?? 0);

    // Get venue-specific thresholds (if configured)
    const { data: venueData, error: venueError } = await supabaseAdmin
      .from('bars')
      .select('bronze_threshold, silver_threshold, gold_threshold')
      .eq('id', bar_id)
      .single();

    if (venueError) {
      console.error('Error fetching venue thresholds:', venueError);
    }

    // Use venue thresholds if present, otherwise fall back to system defaults
    const thresholds = {
      bronze: venueData?.bronze_threshold ?? 3000,
      silver: venueData?.silver_threshold ?? 10000,
      gold: venueData?.gold_threshold ?? 25000,
    };

    return NextResponse.json({
      completedVisits,
      averageSpend,
      weeklyVisits,
      customer_id,
      thresholds,
    });
  } catch (error) {
    console.error('Error fetching loyalty visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty visits data' },
      { status: 500 }
    );
  }
}
