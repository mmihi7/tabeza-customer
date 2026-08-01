import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getCachedOrFetch } from '@/lib/cache';

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

    const cacheKey = `loyalty:visits:${customer_id}:${bar_id}`;

    const result = await getCachedOrFetch(cacheKey, 15, async () => {
      const supabaseAdmin = createServiceRoleClient();

      // Query completed (closed) tabs for this customer at the specific venue
      const { data: completedTabs, error: tabsError } = await supabaseAdmin
        .from('tabs')
        .select('id, closed_at')
        .eq('customer_id', customer_id)
        .eq('bar_id', bar_id)
        .not('closed_at', 'is', null);

      if (tabsError) throw tabsError;

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

      // Include payments from CURRENT open tab for badge upgrade check
      let openTabSpend = 0;
      const { data: openTab, error: openTabError } = await supabaseAdmin
        .from('tabs')
        .select('id')
        .eq('customer_id', customer_id)
        .eq('bar_id', bar_id)
        .is('closed_at', null)
        .maybeSingle();

      if (!openTabError && openTab) {
        const { data: openTabPayments, error: openPaymentsError } = await supabaseAdmin
          .from('tab_payments')
          .select('amount')
          .eq('tab_id', openTab.id)
          .eq('status', 'completed');

        if (!openPaymentsError && openTabPayments) {
          openTabSpend = openTabPayments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0')), 0);
        }
      }

      const totalVisits = completedVisits + (openTabSpend > 0 ? 1 : 0);
      const totalSpendWithOpen = totalSpend + openTabSpend;
      const averageSpend = totalVisits > 0 ? totalSpendWithOpen / totalVisits : 0;

      // Count visits in the past 7 days
      const { data: recentTabs, error: recentError } = await supabaseAdmin
        .from('tabs')
        .select('id, opened_at')
        .eq('customer_id', customer_id)
        .eq('bar_id', bar_id)
        .gte('opened_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const weeklyVisits = recentError ? 0 : (recentTabs?.length ?? 0);

      // Get venue-specific thresholds
      const { data: venueData } = await supabaseAdmin
        .from('bars')
        .select('bronze_threshold, silver_threshold, gold_threshold')
        .eq('id', bar_id)
        .single();

      const thresholds = {
        bronze: venueData?.bronze_threshold ?? 3000,
        silver: venueData?.silver_threshold ?? 10000,
        gold: venueData?.gold_threshold ?? 25000,
      };

      return {
        completedVisits,
        averageSpend,
        weeklyVisits,
        customer_id,
        thresholds,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching loyalty visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty visits data' },
      { status: 500 }
    );
  }
}
