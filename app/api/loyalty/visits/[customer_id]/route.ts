import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params;
    
    // For now, return mock data since the loyalty API endpoints don't exist in customer app
    // In a real implementation, this would fetch from the database
    
    const mockData = {
      totalVisits: 2,
      weeklyVisits: 2,
      visitTier: 'bronze' as const,
      totalSpend: 7500,
      weeklySpend: 7500,
      spendTier: 'low' as const,
      customer_id: customer_id
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching loyalty visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty visits data' },
      { status: 500 }
    );
  }
}
