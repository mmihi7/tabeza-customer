import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    if (!barId) {
      return NextResponse.json(
        { error: 'Bar ID is required' },
        { status: 400 }
      );
    }

    // Use centralized service role client
    const supabase = createServiceRoleClient();

    // Get bar payment settings using service role key
    const { data: barData, error: barError } = await supabase
      .from('bars')
      .select('id, name')
      .eq('id', barId)
      .single();

    if (barError) {
      console.error('Error fetching bar data:', barError);
      return NextResponse.json(
        { error: 'Failed to fetch bar settings' },
        { status: 500 }
      );
    }

    if (!barData) {
      return NextResponse.json(
        { error: 'Bar not found' },
        { status: 404 }
      );
    }

    // Fetch mpesa_enabled separately with type cast to avoid schema type mismatch
    const { data: mpesaData } = await supabase
      .from('bars')
      .select('mpesa_enabled' as any)
      .eq('id', barId)
      .single();

    const mpesaAvailable = (mpesaData as any)?.mpesa_enabled === true;

    return NextResponse.json({
      success: true,
      barId: barData.id,
      barName: barData.name,
      paymentMethods: {
        mpesa: {
          available: mpesaAvailable,
          environment: 'sandbox' // Default to sandbox for customer app
        },
        card: {
          available: false, // Coming soon
          reason: 'Coming soon'
        },
        airtel: {
          available: false, // Coming soon
          reason: 'Coming soon'
        }
      }
    });

  } catch (error) {
    console.error('Payment settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}