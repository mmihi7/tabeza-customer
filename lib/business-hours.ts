/**
 * Shared business-hours utility.
 * Extracted from the inline function inside `loadBarInfo` in `app/start/page.tsx`.
 * The original inline copy is preserved in that file per the non-destructive rule.
 *
 * Validates: Requirements 2.1, 2.2
 */

/**
 * Returns true when the venue is currently open for business.
 *
 * Handles three modes:
 *   - `business_24_hours`: always open
 *   - `simple`: same open/close times every day
 *   - `advanced`: per-day open/close times
 *
 * Overnight hours are supported via the `closeNextDay` flag or by detecting
 * that `closeTotalMinutes < openTotalMinutes`.
 *
 * Defaults to `true` (open) on any error or missing configuration, preserving
 * the existing safe-default behaviour.
 */
export function isWithinBusinessHours(barData: any): boolean {
  try {
    // Handle 24 hours mode
    if (barData.business_24_hours === true) {
      return true;
    }

    // If no business hours configured, always open
    if (!barData.business_hours_mode) {
      return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];

    if (barData.business_hours_mode === 'simple') {
      // Simple mode: same hours every day
      if (!barData.business_hours_simple) {
        return true;
      }

      // Parse open time (format: "HH:MM")
      const [openHour, openMinute] = barData.business_hours_simple.openTime.split(':').map(Number);
      const openTotalMinutes = openHour * 60 + openMinute;

      // Parse close time
      const [closeHour, closeMinute] = barData.business_hours_simple.closeTime.split(':').map(Number);
      const closeTotalMinutes = closeHour * 60 + closeMinute;

      // Handle overnight hours (e.g., 20:00 to 04:00)
      if (barData.business_hours_simple.closeNextDay || closeTotalMinutes < openTotalMinutes) {
        // Venue is open overnight: current time >= open OR current time <= close
        return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
      } else {
        // Normal hours: current time between open and close
        return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
      }

    } else if (barData.business_hours_mode === 'advanced') {
      // Advanced mode: different hours per day
      if (!barData.business_hours_advanced || !barData.business_hours_advanced[currentDay]) {
        return true; // Default to open if no hours for this day
      }

      const dayHours = barData.business_hours_advanced[currentDay];
      if (!dayHours.open || !dayHours.close) {
        return true; // Default to open if missing open/close times
      }

      // Parse open time
      const [openHour, openMinute] = dayHours.open.split(':').map(Number);
      const openTotalMinutes = openHour * 60 + openMinute;

      // Parse close time
      const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
      const closeTotalMinutes = closeHour * 60 + closeMinute;

      // Handle overnight hours
      if (dayHours.closeNextDay || closeTotalMinutes < openTotalMinutes) {
        // Venue is open overnight: current time >= open OR current time <= close
        return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
      } else {
        // Normal hours: current time between open and close
        return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
      }
    }
  } catch (error) {
    console.error('Error checking business hours:', error);
    return true; // Default to open on error
  }

  // Unknown mode — default to open
  return true;
}
