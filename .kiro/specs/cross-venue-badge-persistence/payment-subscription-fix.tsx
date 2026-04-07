// Payment Subscription Fix for Badge System
// Add this useEffect to tabeza-customer/app/menu/page.tsx
// Place it after the other realtime subscription useEffects

// ============================================================================
// PAYMENT REALTIME SUBSCRIPTION - Triggers badge recalculation after payment
// ============================================================================

useEffect(() => {
  if (!tab?.id) return;
  
  console.log('💳 [BADGE] Setting up payment subscription for tab:', tab.id);
  
  const channel = supabase
    .channel(`tab-payments-${tab.id}`, {
      config: {
        broadcast: { self: false },
      },
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tab_payments',
        filter: `tab_id=eq.${tab.id}`,
      },
      (payload) => {
        console.log('💳 [BADGE] Payment received:', {
          payment_id: payload.new.id,
          amount: payload.new.amount,
          status: payload.new.status,
        });
        
        // Only recalculate badge for completed payments
        if (payload.new.status === 'completed') {
          console.log('🔄 [BADGE] Payment completed, recalculating badge...');
          
          // Small delay to ensure tab_balances view is updated
          setTimeout(() => {
            loadLoyaltyData();
          }, 500);
        } else {
          console.log('⏳ [BADGE] Payment not completed yet, status:', payload.new.status);
        }
      }
    )
    .subscribe((status) => {
      console.log('💳 [BADGE] Payment subscription status:', status);
    });
  
  return () => {
    console.log('💳 [BADGE] Cleaning up payment subscription');
    supabase.removeChannel(channel);
  };
}, [tab?.id]);

// ============================================================================
// ALTERNATIVE: Manual Refresh Button (for testing without payment section)
// ============================================================================

// Add this button to the menu page header, near the loyalty icons:

<button
  onClick={() => {
    console.log('🔄 [BADGE] Manual badge refresh triggered');
    setBadgeLoading(true);
    loadLoyaltyData().finally(() => {
      setBadgeLoading(false);
      showToast({
        type: 'success',
        title: 'Badge Status Updated',
        message: 'Your loyalty status has been refreshed',
        duration: 3000
      });
    });
  }}
  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
  disabled={badgeLoading}
>
  {badgeLoading ? (
    <>
      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <span>Refreshing...</span>
    </>
  ) : (
    <>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>Refresh Badge</span>
    </>
  )}
</button>

// ============================================================================
// ALTERNATIVE: Trigger on Order Acceptance (less reliable)
// ============================================================================

// Modify the existing handleOrderUpdate callback to also check badges:

const handleOrderUpdate = useCallback((payload: any) => {
  console.log('📦 [REALTIME] Order UPDATE received:', {
    order_id: payload.new.id,
    status: payload.new.status,
    old_status: payload.old?.status,
  });

  // ... existing order update logic ...

  // NEW: Check badge status when order is accepted
  if (payload.new.status === 'accepted' && payload.old?.status !== 'accepted') {
    console.log('✅ [BADGE] Order accepted, checking badge status');
    
    // Delay to ensure tab_balances view is updated
    setTimeout(() => {
      console.log('🔄 [BADGE] Recalculating badge after order acceptance');
      loadLoyaltyData();
    }, 1000);
  }
}, [/* dependencies */]);

// ============================================================================
// NOTES
// ============================================================================

/*
RECOMMENDED APPROACH:
- Use payment subscription (first option) for production
- Use manual refresh button for testing/development
- Order acceptance trigger is less reliable (doesn't guarantee payment)

TESTING:
1. Add payment subscription
2. Place order and have staff accept it
3. Manually insert payment:
   INSERT INTO tab_payments (id, tab_id, amount, payment_method, status, created_at)
   VALUES (gen_random_uuid(), '<tab_id>', 3500.00, 'mpesa', 'completed', NOW());
4. Watch browser console for badge recalculation logs
5. Verify badge appears in UI

DEBUGGING:
- Check browser console for [BADGE] prefixed logs
- Verify payment subscription is active
- Check if loadLoyaltyData() is being called
- Verify API responses with curl commands
*/
