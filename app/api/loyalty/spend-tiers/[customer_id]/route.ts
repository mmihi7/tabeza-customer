import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { customer_id: string } }
) {
  try {
    // For now, return mock data since the loyalty API endpoints don't exist in customer app
    // In a real implementation, this would fetch from the database
    
    const mockData = {
      totalSpend: 7500,
      weeklySpend: 7500,
      spendTier: 'low' as const,
      customer_id: params.customer_id
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching loyalty spend tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty spend tiers data' },
      { status: 500 }
    );
  }
}
