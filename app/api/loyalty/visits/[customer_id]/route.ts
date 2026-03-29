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

    // Query completed (closed) tabs for this customer at the specific venue,
    // joined with tab_balances to get the spend per tab.
    // A tab is "completed" when closed_at IS NOT NULL.
    const { data: completedTabs, error } = await supabaseAdmin
      .from('tabs')
      .select('id, tab_balances!inner(balance)')
      .eq('owner_identifier', customer_id)
      .eq('bar_id', bar_id)
      .not('closed_at', 'is', null);

    if (error) {
      console.error('Error querying completed tabs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch loyalty visits data' },
        { status: 500 }
      );
    }

    const completedVisits = completedTabs?.length ?? 0;

    // Sum total spend across all completed tabs
    const totalSpend = completedTabs?.reduce((sum, tab) => {
      const balance = Array.isArray(tab.tab_balances)
        ? (tab.tab_balances[0]?.balance ?? 0)
        : ((tab.tab_balances as { balance: number | null } | null)?.balance ?? 0);
      return sum + (balance > 0 ? balance : 0);
    }, 0) ?? 0;

    const averageSpend = completedVisits > 0 ? totalSpend / completedVisits : 0;

    return NextResponse.json({
      completedVisits,
      averageSpend,
      customer_id,
    });
  } catch (error) {
    console.error('Error fetching loyalty visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty visits data' },
      { status: 500 }
    );
  }
}
