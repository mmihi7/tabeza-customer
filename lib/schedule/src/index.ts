/**
 * Venue business-hours evaluation, in the venue's OWN timezone.
 *
 * This module is the single source of truth for "is this venue open?" in
 * application code. It replaces five hand-rolled copies that each compared the
 * venue's stored "HH:MM" wall clock against the SERVER's clock — on Vercel that
 * is UTC, so a Nairobi venue opening at 20:00 was evaluated as 17:00 and a bar
 * closing at 04:00 as 01:00.
 *
 * It mirrors `bar_closed_at` / `get_bar_open_state` in
 * database/migrations/20261002010000_fix_business_hours_shape_and_add_open_state.sql
 * exactly, including its safe default: anything unparseable resolves to OPEN,
 * so a malformed venue can never be reported closed.
 */

export const DEFAULT_TIMEZONE = 'Africa/Nairobi';

export type HoursMode = 'simple' | 'advanced' | '24hours' | null | undefined;

export type SimpleHours = {
  openTime?: string | null;
  closeTime?: string | null;
  closeNextDay?: boolean | null;
} | null;

/**
 * Advanced hours are stored as an ARRAY of weekday objects by the Settings
 * page. A legacy OBJECT keyed by day name is also accepted.
 */
export type AdvancedDayEntry = {
  day?: string | null;
  label?: string | null;
  /** Boolean "is the venue trading on this day" — or, in legacy rows, the open time as a string. */
  open?: boolean | string | null;
  /** Legacy rows stored the close time under `close`. */
  close?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  openNextDay?: boolean | null;
  closeNextDay?: boolean | null;
};

export type AdvancedHours = AdvancedDayEntry[] | Record<string, AdvancedDayEntry> | null;

export type BarSchedule = {
  business_hours_mode?: HoursMode;
  business_hours_simple?: SimpleHours;
  business_hours_advanced?: AdvancedHours;
  business_24_hours?: boolean | null;
  timezone?: string | null;
};

export type OpenReason = 'always_open' | 'open' | 'closed_now' | 'closed_today';

export type OpenState = {
  isOpen: boolean;
  /** Next moment the venue opens. Null when it is open, or always open. */
  opensAt: Date | null;
  /** Next moment the venue closes. Null when it is closed, or always open. */
  closesAt: Date | null;
  timezone: string;
  reason: OpenReason;
};

/**
 * The schedule governing a given venue-local instant (mirrors bar_schedule_at).
 *
 * Modelled as a discriminated union on `traded` so callers get non-null
 * `openMin`/`closeMin` once they have handled the closed-weekday case, without
 * needing a non-null assertion at every use.
 */
type DaySchedule =
  | { traded: true; openMin: number; closeMin: number; overnight: boolean }
  | { traded: false; openMin: null; closeMin: null; overnight: false };

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ── timezone primitives ────────────────────────────────────────────────────

type WallClock = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(bar: Pick<BarSchedule, 'timezone'>): string {
  const tz = bar.timezone?.trim();
  if (tz && isValidTimeZone(tz)) return tz;
  return DEFAULT_TIMEZONE;
}

/** The wall clock an instant shows in the given zone. */
export function wallClockIn(instant: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  // hourCycle h23 can still yield 24 in some ICU builds; normalise to 0.
  const hour = get('hour') % 24;

  return { year: get('year'), month: get('month'), day: get('day'), hour, minute: get('minute'), second: get('second') };
}

/** The zone's UTC offset, in ms, at a given instant. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const w = wallClockIn(instant, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - instant.getTime();
}

/**
 * Convert a venue-local wall clock back to a real instant.
 * Two-pass so it stays correct across a DST transition.
 */
export function instantFromWallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstGuess = naive - zoneOffsetMs(new Date(naive), timeZone);
  const corrected = naive - zoneOffsetMs(new Date(firstGuess), timeZone);
  return new Date(corrected);
}

/** Day of week for a plain calendar date. No timezone involved. */
function weekdayOf(year: number, month: number, day: number): string {
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

// ── schedule parsing (mirrors bar_day_schedule / bar_simple_schedule) ─────

/** "H:MM" or "HH:MM" -> minutes past midnight, or null. */
function parseMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  const total = h * 60 + m;
  return total > 1439 ? null : total;
}

function readBooleanFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    if (t === 'true') return true;
    if (t === 'false') return false;
  }
  return null;
}

function parseSimple(simple: SimpleHours): DaySchedule | null {
  if (!simple || typeof simple !== 'object') return null;

  const openMin = parseMinutes(simple.openTime);
  const closeMin = parseMinutes(simple.closeTime);
  if (openMin === null || closeMin === null) return null;

  const nextDay = readBooleanFlag(simple.closeNextDay) ?? false;
  return { traded: true, openMin, closeMin, overnight: nextDay || closeMin < openMin };
}

function parseAdvancedEntry(entry: AdvancedDayEntry): DaySchedule | null {
  if (!entry || typeof entry !== 'object') return null;

  // "open" is overloaded: a boolean day flag in stored rows, a time string in
  // legacy rows. Only treat it as a time when it is actually a string.
  const tradedFlag = typeof entry.open === 'boolean' ? entry.open : readBooleanFlag(entry.open);
  const traded = tradedFlag ?? true;

  const openMin = parseMinutes(entry.openTime) ?? (typeof entry.open === 'string' ? parseMinutes(entry.open) : null);
  const closeMin = parseMinutes(entry.closeTime) ?? parseMinutes(entry.close);

  if (openMin === null || closeMin === null) {
    // A weekday the venue has explicitly marked as not trading stays closed
    // even when no times were entered for it. Any other incomplete weekday
    // means "not configured".
    if (!traded) return { traded: false, openMin: null, closeMin: null, overnight: false };
    return null;
  }

    const nextDay = readBooleanFlag(entry.openNextDay) ?? readBooleanFlag(entry.closeNextDay) ?? false;
    // `traded` is necessarily true here — the not-trading case returned above.
    return { traded: true, openMin, closeMin, overnight: nextDay || closeMin < openMin };
}

function findAdvancedEntry(advanced: AdvancedHours, weekday: string): AdvancedDayEntry | null {
  if (!advanced || typeof advanced !== 'object') return null;

  if (Array.isArray(advanced)) {
    const target = weekday.toLowerCase();
    const short = target.slice(0, 3);
    const hit = advanced.find((e) => {
      const day = typeof e?.day === 'string' ? e.day.trim().toLowerCase() : '';
      return day === target || day === short;
    });
    return hit ?? null;
  }

  const byFull = (advanced as Record<string, AdvancedDayEntry>)[weekday.toLowerCase()];
  if (byFull && typeof byFull === 'object') return byFull;

  const byShort = (advanced as Record<string, AdvancedDayEntry>)[weekday.toLowerCase().slice(0, 3)];
  if (byShort && typeof byShort === 'object') return byShort;

  return null;
}

/** The schedule governing a given venue-local instant (mirrors bar_schedule_at). */
export function scheduleFor(bar: BarSchedule, local: WallClock): DaySchedule | null {
  const mode = bar.business_hours_mode;
  if (mode === 'simple') return parseSimple(bar.business_hours_simple ?? null);
  if (mode === 'advanced') {
    const entry = findAdvancedEntry(bar.business_hours_advanced ?? null, weekdayOf(local.year, local.month, local.day));
    return entry ? parseAdvancedEntry(entry) : null;
  }
  return null;
}

// ── public API ─────────────────────────────────────────────────────────────

/**
 * Is the venue closed at this instant?
 * Mirrors `bar_closed_at(p_bar_id, p_check_time)`.
 */
export function isClosedAt(bar: BarSchedule, instant: Date = new Date()): boolean {
  if (!instant || Number.isNaN(instant.getTime())) return false;

  if (bar.business_24_hours === true) return false;
  const mode = bar.business_hours_mode;
  if (!mode || mode === '24hours') return false;

  const timeZone = resolveTimeZone(bar);
  const local = wallClockIn(instant, timeZone);
  const nowMin = local.hour * 60 + local.minute;

  const sched = scheduleFor(bar, local);
  if (!sched) return false;
  if (!sched.traded) return true;

  return sched.overnight
    ? nowMin > sched.closeMin && nowMin < sched.openMin
    : nowMin < sched.openMin || nowMin > sched.closeMin;
}

/** Convenience inverse of `isClosedAt`. */
export function isOpenAt(bar: BarSchedule, instant: Date = new Date()): boolean {
  return !isClosedAt(bar, instant);
}

/**
 * Full open state for rendering. Mirrors `get_bar_open_state(p_bar_id)`.
 *
 * `instant` is injectable so the Settings page can preview a proposed schedule
 * at any moment without waiting for real time to pass.
 */
export function getOpenState(bar: BarSchedule, instant: Date = new Date()): OpenState {
  const timeZone = resolveTimeZone(bar);
  const alwaysOpen = { isOpen: true, opensAt: null, closesAt: null, timezone: timeZone, reason: 'always_open' as const };

  if (bar.business_24_hours === true) return alwaysOpen;
  const mode = bar.business_hours_mode;
  if (!mode || mode === '24hours') return alwaysOpen;
  if (!instant || Number.isNaN(instant.getTime())) return alwaysOpen;

  const local = wallClockIn(instant, timeZone);
  const nowMin = local.hour * 60 + local.minute;

  const sched = scheduleFor(bar, local);
  if (!sched) return alwaysOpen;

  // Marked as not trading today — shut until tomorrow.
  if (!sched.traded) {
    return {
      isOpen: false,
      opensAt: instantFromWallClock(local.year, local.month, local.day + 1, 0, 0, timeZone),
      closesAt: null,
      timezone: timeZone,
      reason: 'closed_today',
    };
  }

  const closeToday = instantFromWallClock(
    local.year, local.month, local.day,
    Math.floor(sched.closeMin / 60), sched.closeMin % 60, timeZone,
  );

  if (sched.overnight) {
    if (nowMin > sched.closeMin && nowMin < sched.openMin) {
      // Inside the closed tail. `nowMin < openMin` is always true in this
      // branch, so the next opening is this morning.
      return {
        isOpen: false,
        opensAt: instantFromWallClock(
          local.year, local.month, local.day,
          Math.floor(sched.openMin / 60), sched.openMin % 60, timeZone,
        ),
        closesAt: null,
        timezone: timeZone,
        reason: 'closed_now',
      };
    }
    // Trading. Whether or not this session opened yesterday, the next close is
    // on today's calendar date.
    return { isOpen: true, opensAt: null, closesAt: closeToday, timezone: timeZone, reason: 'open' };
  }

  if (nowMin >= sched.openMin && nowMin <= sched.closeMin) {
    return { isOpen: true, opensAt: null, closesAt: closeToday, timezone: timeZone, reason: 'open' };
  }

  return {
    isOpen: false,
    opensAt: instantFromWallClock(
      local.year, local.month, local.day,
      Math.floor(sched.openMin / 60), sched.openMin % 60, timeZone,
    ),
    closesAt: null,
    timezone: timeZone,
    reason: 'closed_now',
  };
}

/** Human label for an open state, e.g. "Open until 4:00 AM". */
export function describeOpenState(state: OpenState, locale = 'en-GB'): string {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: state.timezone }).format(d);

  switch (state.reason) {
    case 'always_open':
      return 'Open';
    case 'open':
      return state.closesAt ? `Open until ${fmt(state.closesAt)}` : 'Open';
    case 'closed_today':
      return 'Closed today';
    case 'closed_now':
      return state.opensAt ? `Closed — opens ${fmt(state.opensAt)}` : 'Closed';
  }
}
