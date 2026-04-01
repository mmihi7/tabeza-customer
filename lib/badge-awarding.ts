/**
 * Customer Badge Awarding Service
 * Awards badges based on single tab payment amounts when tabs are fully paid
 */

import { createClient } from '@supabase/supabase-js';

interface BadgeAwardResult {
  success: boolean;
  awardedBadge?: 'bronze' | 'silver' | 'gold';
  previousBadge?: 'bronze' | 'silver' | 'gold';
  tabTotal?: number;
  error?: string;
}

/**
 * Award badge based on single tab payment amount
 * Triggered when a tab is fully paid (balance = 0)
 * 
 * Badge thresholds (based on single tab total):
 * - Bronze: KES 1,000 - 2,999
 * - Silver: KES 3,000 - 4,999  
 * - Gold: KES 5,000+
 */
export async function awardBadgeForTabPayment(
  tabId: string,
  customerId: string,
  tabTotal: number
): Promise<BadgeAwardResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    console.log('Checking badge award eligibility:', {
      tabId,
      customerId,
      tabTotal
    });

    // Determine badge based on tab total amount
    let awardedBadge: 'bronze' | 'silver' | 'gold' | null = null;
    
    if (tabTotal >= 5000) {
      awardedBadge = 'gold';
    } else if (tabTotal >= 3000) {
      awardedBadge = 'silver';
    } else if (tabTotal >= 1000) {
      awardedBadge = 'bronze';
    }

    // No badge awarded for amounts below 1000
    if (!awardedBadge) {
      console.log('Tab amount too low for badge award:', {
        tabId,
        tabTotal,
        minimumRequired: 1000
      });
      return {
        success: true,
        tabTotal
      };
    }

    // Get customer's current badge
    const { data: currentProfile, error: profileError } = await supabase
      .from('customer_profiles')
      .select('current_badge')
      .eq('customer_id', customerId)
      .single();

    if (profileError) {
      console.error('Failed to fetch customer profile:', {
        customerId,
        error: profileError
      });
      return {
        success: false,
        error: `Failed to fetch customer profile: ${profileError.message}`,
        tabTotal
      };
    }

    const previousBadge = currentProfile?.current_badge as 'bronze' | 'silver' | 'gold' | null;

    // Only award if it's an upgrade or first badge
    if (previousBadge) {
      const badgeHierarchy = { bronze: 1, silver: 2, gold: 3 };
      const currentLevel = badgeHierarchy[previousBadge];
      const newLevel = badgeHierarchy[awardedBadge];

      if (newLevel <= currentLevel) {
        console.log('Badge not awarded - no upgrade:', {
          tabId,
          customerId,
          previousBadge,
          potentialBadge: awardedBadge,
          tabTotal
        });
        return {
          success: true,
          tabTotal
        };
      }
    }

    // Award the badge
    const { error: updateError } = await supabase
      .from('customer_profiles')
      .update({
        current_badge: awardedBadge,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId);

    if (updateError) {
      console.error('Failed to award badge:', {
        tabId,
        customerId,
        awardedBadge,
        error: updateError
      });
      return {
        success: false,
        error: `Failed to award badge: ${updateError.message}`,
        tabTotal
      };
    }

    // Record badge award in audit log
    const { error: logError } = await supabase
      .from('customer_badge_awards')
      .insert({
        customer_id: customerId,
        tab_id: tabId,
        badge_type: awardedBadge,
        previous_badge: previousBadge,
        tab_amount: tabTotal,
        awarded_at: new Date().toISOString(),
        award_reason: 'single_tab_payment'
      });

    if (logError) {
      console.error('Failed to log badge award:', {
        tabId,
        customerId,
        awardedBadge,
        error: logError
      });
      // Don't fail the award if logging fails
    }

    console.log('Badge awarded successfully:', {
      tabId,
      customerId,
      awardedBadge,
      previousBadge,
      tabTotal
    });

    return {
      success: true,
      awardedBadge,
      previousBadge: previousBadge || undefined,
      tabTotal
    };

  } catch (error) {
    console.error('Badge awarding error:', {
      tabId,
      customerId,
      tabTotal,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tabTotal
    };
  }
}

/**
 * Get customer's current badge
 */
export async function getCustomerBadge(customerId: string): Promise<{
  success: boolean;
  badge?: 'bronze' | 'silver' | 'gold';
  error?: string;
}> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { data: profile, error } = await supabase
      .from('customer_profiles')
      .select('current_badge')
      .eq('customer_id', customerId)
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to fetch customer badge: ${error.message}`
      };
    }

    return {
      success: true,
      badge: profile?.current_badge as 'bronze' | 'silver' | 'gold' | undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
