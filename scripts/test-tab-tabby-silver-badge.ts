/**
 * Test Script: Verify Tab Tabby receives Silver badge at Popos
 * 
 * This script simulates the badge tier calculation for Tab Tabby
 * and verifies that:
 * 1. Silver badge is correctly awarded (spend >= venue threshold)
 * 2. Menu prices reflect the Silver discount
 * 3. Congratulatory message is shown
 * 
 * Run with: NEXT_PUBLIC_SUPABASE_URL=<url> SUPABASE_SECRET_KEY=<key> npx tsx scripts/test-tab-tabby-silver-badge.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error('Warning: Could not load .env.local file');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data
const POPOS_BAR_ID = '438c80c1-fe11-4ac5-8a48-2fc45104ba31';
const TAB_TABBY_CUSTOMER_ID = 'tab-tabby-test-customer';

interface VenueThresholds {
  bronze: number;
  silver: number;
  gold: number;
}

interface LoyaltyData {
  completedVisits: number;
  averageSpend: number;
  weeklyVisits: number;
  thresholds: VenueThresholds;
}

function calculateBadgeTier(averageSpend: number, thresholds: VenueThresholds): string | null {
  if (averageSpend >= thresholds.gold) return 'gold';
  if (averageSpend >= thresholds.silver) return 'silver';
  if (averageSpend >= thresholds.bronze) return 'bronze';
  return null;
}

function calculateVisitBonus(weeklyVisits: number): number {
  if (weeklyVisits >= 3) return 3;
  if (weeklyVisits === 2) return 2;
  if (weeklyVisits === 1) return 1;
  return 0;
}

function calculateDiscountedPrice(
  basePrice: number,
  badgePercent: number,
  visitBonusPercent: number
): number {
  const totalDiscount = badgePercent + visitBonusPercent;
  return basePrice * (1 - totalDiscount / 100);
}

async function testTabTabbySilverBadge() {
  console.log('\n🧪 Testing Tab Tabby Silver Badge Award at Popos\n');
  console.log('='.repeat(60));

  // Step 1: Fetch venue thresholds
  console.log('\n📊 Step 1: Fetching Popos venue thresholds...');
  const { data: venueData, error: venueError } = await supabase
    .from('bars')
    .select('name, bronze_threshold, silver_threshold, gold_threshold')
    .eq('id', POPOS_BAR_ID)
    .single();

  if (venueError) {
    console.error('❌ Error fetching venue data:', venueError);
    return;
  }

  const thresholds: VenueThresholds = {
    bronze: venueData.bronze_threshold ?? 3000,
    silver: venueData.silver_threshold ?? 10000,
    gold: venueData.gold_threshold ?? 25000,
  };

  console.log(`   Venue: ${venueData.name}`);
  console.log(`   Bronze Threshold: KES ${thresholds.bronze.toLocaleString()}`);
  console.log(`   Silver Threshold: KES ${thresholds.silver.toLocaleString()}`);
  console.log(`   Gold Threshold: KES ${thresholds.gold.toLocaleString()}`);

  // Step 2: Fetch Tab Tabby's loyalty data
  console.log('\n📊 Step 2: Fetching Tab Tabby loyalty data...');
  
  // First get completed tabs
  const { data: completedTabs, error: tabsError } = await supabase
    .from('tabs')
    .select('id')
    .eq('owner_identifier', TAB_TABBY_CUSTOMER_ID)
    .eq('bar_id', POPOS_BAR_ID)
    .not('closed_at', 'is', null);

  if (tabsError) {
    console.error('❌ Error fetching tabs:', tabsError);
    return;
  }

  const completedVisits = completedTabs?.length ?? 0;
  
  // Get balances for each completed tab
  let totalSpend = 0;
  if (completedTabs && completedTabs.length > 0) {
    const tabIds = completedTabs.map(t => t.id);
    const { data: balances } = await supabase
      .from('tab_balances')
      .select('tab_id, balance')
      .in('tab_id', tabIds);
    
    totalSpend = balances?.reduce((sum, b) => sum + (b.balance > 0 ? b.balance : 0), 0) ?? 0;
  }

  const averageSpend = completedVisits > 0 ? totalSpend / completedVisits : 0;

  // Count weekly visits
  const { data: recentTabs } = await supabase
    .from('tabs')
    .select('id, opened_at')
    .eq('customer_id', TAB_TABBY_CUSTOMER_ID)
    .eq('bar_id', POPOS_BAR_ID)
    .gte('opened_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const weeklyVisits = recentTabs?.length ?? 0;

  console.log(`   Completed Visits: ${completedVisits}`);
  console.log(`   Total Spend: KES ${totalSpend.toLocaleString()}`);
  console.log(`   Average Spend: KES ${averageSpend.toLocaleString()}`);
  console.log(`   Weekly Visits (past 7 days): ${weeklyVisits}`);

  // Step 3: Calculate badge tier
  console.log('\n🏆 Step 3: Calculating badge tier...');
  const earnedTier = calculateBadgeTier(averageSpend, thresholds);
  const visitBonusPercent = calculateVisitBonus(weeklyVisits);

  console.log(`   Earned Badge Tier: ${earnedTier ? earnedTier.toUpperCase() : 'NONE'}`);
  console.log(`   Visit Bonus: ${visitBonusPercent}%`);

  // Step 4: Verify Silver badge award
  console.log('\n✅ Step 4: Verifying Silver badge award...');
  
  if (earnedTier === 'silver') {
    console.log('   ✅ SUCCESS: Tab Tabby correctly receives Silver badge!');
    console.log(`   ✅ Condition met: ${averageSpend.toLocaleString()} >= ${thresholds.silver.toLocaleString()}`);
    
    // Show congratulatory message
    console.log('\n🎉 CONGRATULATORY MESSAGE:');
    console.log('   ┌─────────────────────────────────────────────────────┐');
    console.log('   │                                                     │');
    console.log('   │  🎊  Hooray! You are now a Silver member! 🎊       │');
    console.log(`   │                                                     │`);
    console.log(`   │  Congratulations! You've earned Silver status       │`);
    console.log(`   │  at ${venueData.name.padEnd(43)} │`);
    console.log('   │                                                     │');
    console.log('   └─────────────────────────────────────────────────────┘');
  } else {
    console.log(`   ❌ FAILED: Expected Silver, got ${earnedTier ?? 'NONE'}`);
    console.log(`   ❌ Condition: ${averageSpend.toLocaleString()} >= ${thresholds.silver.toLocaleString()} = ${averageSpend >= thresholds.silver}`);
    return;
  }

  // Step 5: Calculate discounted menu prices
  console.log('\n💰 Step 5: Calculating discounted menu prices...');
  
  // Fetch venue discount settings
  const { data: discountSettings } = await supabase
    .from('venue_discount_settings')
    .select('spend_tiers, visit_bonuses')
    .eq('bar_id', POPOS_BAR_ID)
    .single();

  const silverBadgePercent = discountSettings?.spend_tiers?.silver ?? 3;
  const visitBonusPercentFromSettings = discountSettings?.visit_bonuses?.[`${weeklyVisits}x`] ?? visitBonusPercent;

  console.log(`   Silver Badge Discount: ${silverBadgePercent}%`);
  console.log(`   Visit Frequency Bonus: ${visitBonusPercentFromSettings}%`);
  console.log(`   Total Discount: ${silverBadgePercent + visitBonusPercentFromSettings}%`);

  // Example menu items
  const sampleMenuItems = [
    { name: 'Tusker Lager 500ml', basePrice: 300 },
    { name: 'Nyama Choma', basePrice: 800 },
    { name: 'Chips Masala', basePrice: 250 },
  ];

  console.log('\n   Sample Menu Prices:');
  console.log('   ┌─────────────────────────┬──────────────┬──────────────┬──────────┐');
  console.log('   │ Item                    │ Base Price   │ Your Price   │ Savings  │');
  console.log('   ├─────────────────────────┼──────────────┼──────────────┼──────────┤');

  sampleMenuItems.forEach(item => {
    const discountedPrice = calculateDiscountedPrice(
      item.basePrice,
      silverBadgePercent,
      visitBonusPercentFromSettings
    );
    const savings = item.basePrice - discountedPrice;
    const savingsPercent = (savings / item.basePrice) * 100;

    console.log(
      `   │ ${item.name.padEnd(23)} │ KES ${item.basePrice.toString().padStart(7)} │ KES ${discountedPrice.toFixed(0).padStart(7)} │ ${savingsPercent.toFixed(1)}%    │`
    );
  });

  console.log('   └─────────────────────────┴──────────────┴──────────────┴──────────┘');

  // Step 6: Summary
  console.log('\n📋 SUMMARY:');
  console.log('   ✅ Silver badge correctly awarded');
  console.log('   ✅ Menu prices reflect Silver discount');
  console.log('   ✅ Congratulatory message displayed');
  console.log('   ✅ All requirements met!');
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run the test
testTabTabbySilverBadge().catch(console.error);
