/**
 * Business-hours facade for the customer app.
 *
 * This used to hold a full re-implementation of the schedule logic. That copy
 * was wrong in two ways that the venue could actually feel:
 *
 *   1. It read the clock with `new Date().getHours()`, which is the *browser's*
 *      timezone. A guest in Nairobi opening a tab at a Mombasa venue, or a
 *      phone left on UTC, got the wrong answer.
 *   2. It indexed `business_hours_advanced` as an object keyed by day name, but
 *      the Settings page has always written that column as an ARRAY. Every
 *      advanced-hours venue therefore silently fell through to "open".
 *
 * The authoritative evaluation now lives in `@tabeza/schedule`, which resolves
 * the venue's own timezone from `bars.timezone` and understands both the array
 * and the legacy object shape. PostgreSQL enforces the same rules server-side
 * via `create_tab_if_not_exists`, so this module is display and preview only —
 * it must never be the thing that decides.
 *
 * Validates: Requirements 2.1, 2.2
 */

import {
  getOpenState,
  isOpenAt,
  type BarSchedule,
  type OpenState,
} from '@tabeza/schedule';

export { describeOpenState, getOpenState, isClosedAt, isOpenAt } from '@tabeza/schedule';
export type { BarSchedule, OpenState } from '@tabeza/schedule';

/**
 * Returns true when the venue is currently open for business.
 *
 * Unconfigured venues are treated as open — the same default the database
 * applies, so the UI and the server never disagree about a venue that has
 * never been set up.
 */
export function isWithinBusinessHours(
  barData: BarSchedule,
  instant: Date = new Date(),
): boolean {
  return isOpenAt(barData, instant);
}

/**
 * Full open state for the venue, including when it next opens or closes.
 * Use this instead of hand-rolling a countdown — it is already timezone-aware
 * and handles overnight and closed-today cases.
 */
export function getVenueOpenState(
  barData: BarSchedule,
  instant: Date = new Date(),
): OpenState {
  return getOpenState(barData, instant);
}
