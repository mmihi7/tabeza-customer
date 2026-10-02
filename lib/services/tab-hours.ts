/**
 * Tab business-hours service layer (customer app).
 *
 * Every route that can create or revive a tab needs the same two things, in the
 * same order:
 *
 *   1. Is the caller already holding an open/closing tab at this venue? If so,
 *      hand it back — even when the venue is shut. A guest who already has a tab
 *      must never be told "the venue is closed".
 *   2. Is the venue open *right now*, according to PostgreSQL? If not, refuse.
 *
 * The ordering is the whole point. It was previously implemented per-route and
 * got inverted once, which made an existing-tab customer see a closed-venue
 * refusal. Both steps now live here, so a route cannot get the order wrong by
 * accident — `decideTabCreation` performs the lookup before the gate internally.
 *
 * The gate itself is deliberately *not* reimplemented in TypeScript: the
 * authoritative answer comes from the `get_bar_open_state` SQL function, which
 * resolves the venue's own timezone from `bars.timezone`. See
 * `tabeza-staff/database/migrations/20261002010000_fix_business_hours_shape_and_add_open_state.sql`.
 *
 * Client handling: a `venue_closed` refusal is a normal outcome, not an error —
 * `app/start/page.tsx` routes it to `BarClosedSlideIn` via `showVenueClosed()`.
 * It must never surface as a "Tab Creation Failed" toast.
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Row shape returned by `get_bar_open_state`. */
export interface BarOpenState {
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  timezone: string | null;
  reason: string | null;
}

/** An open/closing tab the caller already holds at this venue. */
export interface ActiveCustomerTab {
  id: string;
  tab_number: number | null;
  status: string | null;
}

export type TabAccessDecision =
  /** No active tab and the venue is open — proceed with creation/reopen. */
  | { kind: 'allowed'; openState: BarOpenState | null }
  /** The caller already holds a tab; hand it back untouched. */
  | { kind: 'has_active_tab'; existingTab: ActiveCustomerTab }
  /** The venue is shut. `body` carries the VENUE_CLOSED payload for the UI. */
  | { kind: 'venue_closed'; status: 403; body: VenueClosedBody }
  /** The hours query itself failed — deliberately not the same as "closed". */
  | { kind: 'hours_unavailable'; status: 503; body: { error: string } }
  /** The active-tab lookup failed. */
  | { kind: 'lookup_failed'; status: 500; body: { error: string } };

export interface VenueClosedBody {
  error: 'Venue is currently closed';
  code: 'VENUE_CLOSED';
  reason: string | null;
  opensAt: string | null;
  timezone: string | null;
}

/** The shared refusal body for an already-active tab (200, not an HTTP error). */
export const ACTIVE_TAB_BODY = {
  success: false,
  message: 'You already have an active tab',
} as const;

/**
 * Turns a non-`allowed` decision into the HTTP response for the route.
 * Routes should return this directly rather than rebuilding the payload.
 */
export function refusalResponse(decision: TabAccessDecision): NextResponse | null {
  switch (decision.kind) {
    case 'allowed':
      return null;
    case 'has_active_tab':
      return NextResponse.json({ ...ACTIVE_TAB_BODY, existingTab: decision.existingTab });
    default:
      return NextResponse.json(decision.body, { status: decision.status });
  }
}

/**
 * The authoritative gate. Use this when there is no active-tab question to ask —
 * e.g. reopening a specific overdue tab, where the tab is already known.
 *
 * Returns `{ kind: 'allowed' }` when the venue is open.
 */
export async function enforceVenueOpen(
  supabase: SupabaseClient,
  barId: string,
  context: { barId?: string; tabId?: string } = {},
): Promise<TabAccessDecision> {
  const { data, error } = await supabase
    .rpc('get_bar_open_state', { p_bar_id: barId })
    .single();

  if (error) {
    // A failed hours query must NOT be treated as "closed": that would lock
    // customers out of a venue that is actually open. Surface it as retryable.
    console.error('❌ Business-hours check failed:', error);
    return {
      kind: 'hours_unavailable',
      status: 503,
      body: { error: 'Could not verify venue hours' },
    };
  }

  const openState = (data ?? null) as BarOpenState | null;

  if (!openState?.is_open) {
    console.log('🚫 Venue closed — refusing:', {
      ...context,
      reason: openState?.reason,
      opensAt: openState?.opens_at,
    });
    return {
      kind: 'venue_closed',
      status: 403,
      body: {
        error: 'Venue is currently closed',
        code: 'VENUE_CLOSED',
        reason: openState?.reason ?? null,
        opensAt: openState?.opens_at ?? null,
        timezone: openState?.timezone ?? null,
      },
    };
  }

  return { kind: 'allowed', openState };
}

/**
 * The full tab-creation decision: existing-tab lookup FIRST, then the gate.
 *
 * This is the function creation routes should call. Keeping the two steps in one
 * body is what prevents the "gate ran before the lookup" regression.
 */
export async function decideTabCreation(
  supabase: SupabaseClient,
  params: { barId: string; ownerIdentifier: string },
): Promise<TabAccessDecision> {
  const { barId, ownerIdentifier } = params;

  // Step 1 — before any hours check. An existing open/closing tab must stay
  // usable even after the venue shuts.
  const { data: existingTabs, error: existingError } = await supabase
    .from('tabs')
    .select('id, tab_number, status')
    .eq('bar_id', barId)
    .eq('owner_identifier', ownerIdentifier)
    .in('status', ['open', 'closing']);

  if (existingError) {
    console.error('❌ Error checking existing tabs:', existingError);
    return {
      kind: 'lookup_failed',
      status: 500,
      body: { error: 'Failed to check existing tabs' },
    };
  }

  if (existingTabs && existingTabs.length > 0) {
    console.log('ℹ️ Customer already has active tab:', existingTabs[0]);
    return { kind: 'has_active_tab', existingTab: existingTabs[0] as ActiveCustomerTab };
  }

  // Step 2 — only now is it legitimate to consult business hours.
  return enforceVenueOpen(supabase, barId, { barId });
}