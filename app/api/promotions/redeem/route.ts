/**
 * POST /api/promotions/redeem
 *
 * Redeems a promotion for a known customer on an active tab.
 *
 * Body: { customerId, barId, tabId, promotionId, discountApplied? }
 *
 * Flow:
 *  1. Re-validate the promotion is active, not expired, and still eligible for
 *     this customer (via get_eligible_promotions) — server-side, don't trust
 *     the client.
 *  2. Re-check redemption caps / first-visit-only (idempotency + caps).
 *  3. Insert into promotion_redemptions. The on_promo_redeemed_loyalty trigger
 *     awards the loyalty event (0 pts first-visit, 10 pts returning).
 *  4. Invalidate the eligible-promos Redis cache so the redeemed promo
 *     disappears on the next poll.
 *
 * Returns the created redemption row + awarded event info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { invalidateCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, barId, tabId, promotionId, discountApplied } = body;

    if (!customerId || !barId || !tabId || !promotionId) {
      return NextResponse.json(
        { error: 'customerId, barId, tabId, and promotionId are all required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 1. Load the promotion and confirm it's active + within validity window.
    const { data: promo, error: promoError } = await (supabase as any)
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .eq('bar_id', barId)
      .eq('status', 'active')
      .maybeSingle();

    if (promoError) {
      console.error('[promotions/redeem promo]', promoError);
      return NextResponse.json({ error: 'Failed to load promotion' }, { status: 500 });
    }
    if (!promo) {
      return NextResponse.json({ error: 'Promotion is not active' }, { status: 409 });
    }
    if (promo.valid_until && new Date(promo.valid_until).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Promotion has expired' }, { status: 409 });
    }

    // 2. Re-validate eligibility server-side via the DB function — same source
    //    of truth as the eligible list, so we can't be gamed by parallel tabs.
    const { data: eligibleList, error: eligibleError } = await (supabase as any).rpc(
      'get_eligible_promotions',
      { p_customer_id: customerId, p_bar_id: barId, p_tab_id: tabId }
    );
    if (eligibleError) {
      console.error('[promotions/redeem eligible]', eligibleError);
      return NextResponse.json({ error: 'Failed to validate eligibility' }, { status: 500 });
    }
    const eligible = (eligibleList ?? []).some(
      (p: { id: string }) => p.id === promotionId
    );
    if (!eligible) {
      return NextResponse.json(
        { error: 'Promotion is not eligible for this customer' },
        { status: 409 }
      );
    }

    // 3. Idempotency: a customer cannot redeem the same (first-visit-only / capped)
    //    promo twice per tab. get_eligible_promotions already enforces caps, so
    //    eligibility above is the guard. Insert the redemption.
    const { data: redemption, error: insertError } = await (supabase as any)
      .from('promotion_redemptions')
      .insert({
        promotion_id: promotionId,
        customer_id: customerId,
        tab_id: tabId,
        bar_id: barId,
        discount_applied: discountApplied ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[promotions/redeem insert]', insertError);
      return NextResponse.json({ error: 'Failed to record redemption' }, { status: 500 });
    }

    // 4. Invalidate eligible cache so the redeemed promo disappears from the
    //    customer's list on the next 30s poll.
    await invalidateCache(`promotions:eligible:${barId}:${customerId}:${tabId}`);
    // Also drop any tab-agnostic caches under this bar+customer.
    await invalidateCache(`promotions:eligible:${barId}:${customerId}:*`);

    return NextResponse.json({ redemption }, { status: 201 });
  } catch (error) {
    console.error('[promotions/redeem] unhandled', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
