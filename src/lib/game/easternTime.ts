/**
 * Eastern-Time calendar helpers.
 *
 * The daily challenge rolls over at midnight in America/New_York. This
 * module holds the zone maths on its own, with no Node-only imports, so
 * both the server (lib/game/dailyTarget.ts) and client components can use
 * it — the countdown in the corner has to tick toward the same instant the
 * server resets on.
 *
 * Everything goes through the IANA database via Intl rather than a fixed
 * offset: Eastern is UTC-5 in winter and UTC-4 under daylight saving, so a
 * constant would drift the reset by an hour twice a year and make the
 * transition days the wrong length.
 */

/** The zone the daily challenge rolls over in. */
export const DAILY_TIMEZONE = "America/New_York";

// en-CA formats as YYYY-MM-DD, which is exactly the key format we store.
const KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: DAILY_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: DAILY_TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const CLOCK_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: DAILY_TIMEZONE,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Returns the calendar date in Eastern Time as "YYYY-MM-DD".
 *
 * This is the identity of the daily game. Every player is served the same
 * key for the same instant regardless of where they are, because the
 * conversion happens against a fixed zone rather than the browser's clock.
 */
export function dateKeyEastern(date: Date = new Date()): string {
  return KEY_FORMATTER.format(date);
}

/** The wall clock in Eastern Time as "HH:MM:SS". */
export function easternClock(date: Date = new Date()): string {
  return CLOCK_FORMATTER.format(date);
}

/**
 * How far Eastern Time is from UTC at a given instant, in milliseconds
 * (negative, since the zone is behind UTC). Derived by formatting the
 * instant in the zone and reading the wall clock back, so daylight saving
 * is handled by the platform's timezone database rather than by us.
 */
function zoneOffsetMs(date: Date): number {
  const parts = PARTS_FORMATTER.formatToParts(date);
  const field = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const wallClockAsUtc = Date.UTC(
    field("year"),
    field("month") - 1,
    field("day"),
    field("hour"),
    field("minute"),
    field("second"),
  );
  // Compare against the instant truncated to whole seconds, because the
  // formatted parts carry no sub-second precision.
  return wallClockAsUtc - (date.getTime() - (date.getTime() % 1000));
}

/**
 * The UTC instant at which a given Eastern calendar day begins.
 *
 * The offset is resolved twice: once against a naive guess, then again
 * against the instant that guess produced. On a day when the offset
 * changes, the first lookup can return the wrong side of the transition,
 * and the second settles it. Eastern Time shifts at 02:00 local, so
 * midnight itself is never skipped or repeated and this always converges.
 */
export function easternMidnightUtcMs(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number) as [number, number, number];
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const firstPass = naive - zoneOffsetMs(new Date(naive));
  return naive - zoneOffsetMs(new Date(firstPass));
}

/** Shifts a "YYYY-MM-DD" key by whole calendar days. */
export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/**
 * Calendar arithmetic on the key itself, not on an instant. A key is a
 * bare date with no zone attached, so "the day before 2026-03-08" is
 * 2026-03-07 whether or not a clock change falls in between.
 */
export function previousDateKey(dateKey: string): string {
  return shiftDateKey(dateKey, -1);
}

export function nextDateKey(dateKey: string): string {
  return shiftDateKey(dateKey, 1);
}

/** The instant the current daily game gives way to the next one. */
export function nextDailyResetAt(date: Date = new Date()): Date {
  return new Date(easternMidnightUtcMs(nextDateKey(dateKeyEastern(date))));
}

/** Milliseconds until the next midnight in Eastern Time. */
export function msUntilNextDailyReset(date: Date = new Date()): number {
  return nextDailyResetAt(date).getTime() - date.getTime();
}
