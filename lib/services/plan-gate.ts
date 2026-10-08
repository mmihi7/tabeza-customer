/**
 * Plan soft-lock gate (customer app).
 *
 * When a venue's subscription lapses (bars.plan_status = 'past_due', set by
 * the trial-warning-engine at trial expiry or an expired paid cycle) the
 * venue goes read-only: no new tabs, no reopened tabs, no new orders. Existing
 * open/overdue tabs are never refused here — the caller must run its
 * existing-tab lookup first (same rule as the business-hours gate in
 * `tab-hours.ts`), so a customer already holding a tab can still browse,
 * order on it and settle up. Only starting/reviving service is refused.
 *
 * Deliberately narrow: only 'past_due' is refused. Trial, pending_payment,
 * active and legacy null/none venues all keep working, and payment routes are
 * never gated.
 *
 * The message is customer-safe on purpose: guests cannot fix venue billing,
 * so no plan/subscription vocabulary leaks to them. Mirrors the staff-side
 * `tabeza-staff/lib/billing/gate.ts` (402 PAYMENT_REQUIRED), which staff UI
 * matches on to open the PaywallModal.
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PlanGateResult {
  ok: boolean;
  planStatus: string | null;
  barId: string;
  response?: NextResponse;
}

function venueUnavailable(barId: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Venue temporarily unavailable',
      code: 'PAYMENT_REQUIRED',
      bar_id: barId,
      message:
        'This venue is temporarily unavailable. Please ask a member of staff for help.',
    },
    { status: 402 },
  );
}

/**
 * Returns `{ ok: true }` when writes are allowed, or `{ ok: false, response }`
 * with a ready-to-return 402 when the venue is soft-locked.
 *
 * Usage:
 *   const gate = await assertPlanWritable(supabase, barId)
 *   if (!gate.ok) return gate.response!
 */
export async function assertPlanWritable(
  db: SupabaseClient,
  barId: string,
): Promise<PlanGateResult> {
  const { data: bar, error } = await db
    .from('bars')
    .select('plan_status')
    .eq('id', barId)
    .maybeSingle();

  if (error) {
    // A failed status query must not lock guests out of a healthy venue —
    // same reasoning as the hours check staying a 503 rather than "closed".
    console.error('❌ Plan-status check failed:', error);
    return { ok: true, planStatus: null, barId };
  }

  const planStatus: string | null = (bar as any)?.plan_status ?? null;
  if (planStatus === 'past_due') {
    return { ok: false, planStatus, barId, response: venueUnavailable(barId) };
  }
  return { ok: true, planStatus, barId };
}
