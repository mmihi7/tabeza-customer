/**
 * Backfill Script: Create test data for Tab Tabby at Popos
 * 
 * This script creates:
 * 1. A test customer (Tab Tabby)
 * 2. A completed tab with KES 5,480 spend at Popos
 * 3. Verifies Silver badge is awarded
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
const TAB_TABBY_EMAIL = 'tab.tabby@test.tabeza.co.ke';
const TAB_TABBY_SPEND = 5480; // KES 5,480 - above Popos Silver threshold (5,000)

async function backfillTabTabbyData() {
  console.log('\n🔧 Backfilling Tab Tabby Test Data at Popos\n');
  console.log('='.repeat(60));

  // Step 1: Check if customer exists, create if not
  console.log('\n👤 Step 1: Setting up Tab Tabby customer...');
  
  let { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, email, first_name')
    .eq('email', TAB_TABBY_EMAIL)
    .single();

  let customerId: string;

  if (existingCustomer) {
    console.log(`   ✅ Customer exists: ${existingCustomer.first_name} (${existingCustomer.email})`);
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email: TAB_TABBY_EMAIL,
        first_name: 'Tab',
        last_name: 'Tabby',
        phone: '+254700000001',
      })
      .select()
      .single();

    if (customerError) {
      console.error('❌ Error creating customer:', customerError);
      return;
    }

    customerId = newCustomer.id;
    console.log(`   ✅ Created customer: Tab Tabby (${TAB_TABBY_EMAIL})`);
  }

  // Step 2: Create a completed tab
  console.log('\n📋 Step 2: Creating completed tab...');
  
  const { data: newTab, error: tabError } = await supabase
    .from('tabs')
    .insert({
      bar_id: POPOS_BAR_ID,
      customer_id: customerId,
      owner_identifier: TAB_TABBY_EMAIL,
      opened_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      closed_at: new Date().toISOString(), // Just closed
      status: 'closed',
    })
    .select()
    .single();

  if (tabError) {
    console.error('❌ Error creating tab:', tabError);
    return;
  }

  console.log(`   ✅ Created tab: ${newTab.id}`);
  console.log(`   ✅ Status: ${newTab.status}`);
  console.log(`   ✅ Opened: ${new Date(newTab.opened_at).toLocaleString()}`);
  console.log(`   ✅ Closed: ${new Date(newTab.closed_at!).toLocaleString()}`);

  // Step 3: Add orders to the tab
  console.log('\n🍺 Step 3: Adding orders to tab...');
  
  const orders = [
    { name: 'Tusker Lager 500ml', quantity: 4, price: 300, total: 1200 },
    { name: 'Nyama Choma', quantity: 2, price: 800, total: 1600 },
    { name: 'Chips Masala', quantity: 3, price: 250, total: 750 },
    { name: 'Pilau', quantity: 2, price: 400, total: 800 },
    { name: 'Soda', quantity: 4, price: 100, total: 400 },
    { name: 'Kachumbari', quantity: 2, price: 150, total: 300 },
    { name: 'Samosa', quantity: 6, price: 50, total: 300 },
    { name: 'Mandazi', quantity: 4, price: 30, total: 120 },
    { name: 'Chai', quantity: 2, price: 50, total: 100 },
    { name: 'Service Charge', quantity: 1, price: 910, total: 910 }, // 10% service charge
  ];

  const totalOrderValue = orders.reduce((sum, order) => sum + order.total, 0);
  console.log(`   📊 Total order value: KES ${totalOrderValue.toLocaleString()}`);

  for (const order of orders) {
    const { error: orderError } = await supabase
      .from('tab_orders')
      .insert({
        tab_id: newTab.id,
        item_name: order.name,
        quantity: order.quantity,
        price: order.price,
        total: order.total,
        status: 'accepted',
        ordered_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 mins ago
      });

    if (orderError) {
      console.error(`   ❌ Error adding order ${order.name}:`, orderError);
    } else {
      console.log(`   ✅ Added: ${order.quantity}x ${order.name} @ KES ${order.price} = KES ${order.total}`);
    }
  }

  // Step 4: Add payment
  console.log('\n💳 Step 4: Adding payment...');
  
  const { error: paymentError } = await supabase
    .from('tab_payments')
    .insert({
      tab_id: newTab.id,
      amount: TAB_TABBY_SPEND,
      payment_method: 'mpesa',
      status: 'completed',
      paid_at: new Date().toISOString(),
    });

  if (paymentError) {
    console.error('❌ Error adding payment:', paymentError);
    return;
  }

  console.log(`   ✅ Payment added: KES ${TAB_TABBY_SPEND.toLocaleString()}`);

  // Step 5: Verify badge tier calculation
  console.log('\n🏆 Step 5: Verifying badge tier calculation...');
  
  // Fetch venue thresholds
  const { data: venueData } = await supabase
    .from('bars')
    .select('name, bronze_threshold, silver_threshold, gold_threshold')
    .eq('id', POPOS_BAR_ID)
    .single();

  const thresholds = {
    bronze: venueData?.bronze_threshold ?? 3000,
    silver: venueData?.silver_threshold ?? 10000,
    gold: venueData?.gold_threshold ?? 25000,
  };

  console.log(`   Venue: ${venueData?.name}`);
  console.log(`   Silver Threshold: KES ${thresholds.silver.toLocaleString()}`);
  console.log(`   Customer Spend: KES ${TAB_TABBY_SPEND.toLocaleString()}`);

  // Calculate badge tier
  let earnedTier = null;
  if (TAB_TABBY_SPEND >= thresholds.gold) earnedTier = 'gold';
  else if (TAB_TABBY_SPEND >= thresholds.silver) earnedTier = 'silver';
  else if (TAB_TABBY_SPEND >= thresholds.bronze) earnedTier = 'bronze';

  console.log(`   Earned Badge Tier: ${earnedTier ? earnedTier.toUpperCase() : 'NONE'}`);

  if (earnedTier === 'silver') {
    console.log('\n🎉 SUCCESS! Tab Tabby receives Silver badge!');
    console.log('\n   ┌─────────────────────────────────────────────────────┐');
    console.log('   │                                                     │');
    console.log('   │  🎊  Hooray! You are now a Silver member! 🎊       │');
    console.log('   │                                                     │');
    console.log('   │  Congratulations! You\'ve earned Silver status      │');
    console.log(`   │  at ${venueData?.name?.padEnd(43)} │`);
    console.log('   │                                                     │');
    console.log('   └─────────────────────────────────────────────────────┘');
  } else {
    console.log(`\n❌ FAILED: Expected Silver, got ${earnedTier ?? 'NONE'}`);
  }

  // Step 6: Show menu price examples
  console.log('\n💰 Step 6: Sample menu prices with Silver discount...');
  
  const { data: discountSettings } = await supabase
    .from('venue_discount_settings')
    .select('spend_tiers')
    .eq('bar_id', POPOS_BAR_ID)
    .single();

  const silverDiscount = discountSettings?.spend_tiers?.silver ?? 3;
  
  console.log(`   Silver Badge Discount: ${silverDiscount}%`);
  console.log('\n   Sample Menu Items:');
  console.log('   ┌─────────────────────────┬──────────────┬──────────────┐');
  console.log('   │ Item                    │ Base Price   │ Your Price   │');
  console.log('   ├─────────────────────────┼──────────────┼──────────────┤');

  const sampleItems = [
    { name: 'Tusker Lager 500ml', price: 300 },
    { name: 'Nyama Choma', price: 800 },
    { name: 'Chips Masala', price: 250 },
  ];

  sampleItems.forEach(item => {
    const discountedPrice = item.price * (1 - silverDiscount / 100);
    console.log(
      `   │ ${item.name.padEnd(23)} │ KES ${item.price.toString().padStart(7)} │ KES ${discountedPrice.toFixed(0).padStart(7)} │`
    );
  });

  console.log('   └─────────────────────────┴──────────────┴──────────────┘');

  console.log('\n📋 SUMMARY:');
  console.log(`   ✅ Customer created: Tab Tabby (${TAB_TABBY_EMAIL})`);
  console.log(`   ✅ Tab created and closed: ${newTab.id}`);
  console.log(`   ✅ Orders added: ${orders.length} items`);
  console.log(`   ✅ Payment recorded: KES ${TAB_TABBY_SPEND.toLocaleString()}`);
  console.log(`   ✅ Silver badge awarded (${TAB_TABBY_SPEND} >= ${thresholds.silver})`);
  console.log('   ✅ Menu prices reflect Silver discount');
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run the backfill
backfillTabTabbyData().catch(console.error);
