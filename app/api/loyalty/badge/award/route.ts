import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

// Badge rank mapping for comparison
const BADGE_RANK = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
} as const;

type BadgeLevel = keyof typeof BADGE_RANK;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, bar_id, badge_level, spend_amount } = body;

    // Validation: Required fields
    if (!customer_id || !bar_id || !badge_level || spend_amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, bar_id, badge_level, spend_amount' },
        { status: 400 }
      );
    }

    // Validation: badge_level must be valid
    if (!BADGE_RANK[badge_level as BadgeLevel]) {
      return NextResponse.json(
        { error: 'Invalid badge level. Must be one of: bronze, silver, gold, platinum' },
        { status: 400 }
      );
    }

    // Validation: spend_amount must be positive and reasonable
    if (typeof spend_amount !== 'number' || spend_amount <= 0 || spend_amount >= 1000000) {
      return NextResponse.json(
        { error: 'Invalid spend amount. Must be positive and less than 1,000,000' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Query current active badge for customer
    const { data: currentBadge, error: fetchError } = await supabase
      .from('customer_badges')
      .select('badge_level')
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching current badge:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current badge' },
        { status: 500 }
      );
    }

    // Compare badge ranks
    const currentRank = currentBadge ? BADGE_RANK[currentBadge.badge_level as BadgeLevel] : 0;
    const newRank = BADGE_RANK[badge_level as BadgeLevel];

    // If new rank <= current rank, no upgrade needed
    if (newRank <= currentRank) {
      return NextResponse.json({
        upgraded: false,
        currentBadge,
        message: `Customer already has ${currentBadge?.badge_level || 'no badge'}`,
      });
    }

    // Execute upgrade transaction
    // Step 1: Deactivate old badge (if exists)
    if (currentBadge) {
      const { error: deactivateError } = await supabase
        .from('customer_badges')
        .update({ is_active: false })
        .eq('customer_id', customer_id)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating old badge:', deactivateError);
        return NextResponse.json(
          { error: 'Failed to deactivate old badge' },
          { status: 500 }
        );
      }
    }

    // Step 2: Insert new badge
    const { data: newBadge, error: insertError } = await supabase
      .from('customer_badges')
      .insert({
        customer_id,
        badge_level,
        earned_at_bar_id: bar_id,
        spend_amount_at_venue: spend_amount,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting new badge:', insertError);
      return NextResponse.json(
        { error: 'Failed to award badge' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      upgraded: true,
      newBadge,
      oldBadge: currentBadge,
    });
  } catch (error) {
    console.error('Error in badge award route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
