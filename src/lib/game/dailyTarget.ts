import { createHash } from "node:crypto";

/**
 * Deterministic daily target selection.
 *
 * The daily skin is derived from the calendar date in Eastern Time, never
 * chosen client-side and never re-rolled on refresh: the same `dateKey`
 * always hashes to the same index for a given pool size. This module is
 * server-only (uses node:crypto) — it must only be imported from API
 * routes / server code, never from a "use client" component.
 *
 * The zone maths lives in ./easternTime, which has no Node-only imports so
 * the countdown in the UI can tick toward the same instant the server
 * resets on. Those helpers are re-exported here for server callers.
 */
export {
  DAILY_TIMEZONE,
  dateKeyEastern,
  msUntilNextDailyReset,
  nextDailyResetAt,
  nextDateKey,
  previousDateKey,
  shiftDateKey,
} from "./easternTime";

/**
 * Deterministically maps a date key to an index in [0, poolSize).
 * Uses SHA-256 rather than a naive string hash to avoid the clustering /
 * short-cycle issues small hash functions have over sequential inputs like
 * calendar dates.
 */
export function dailyIndexForDate(dateKey: string, poolSize: number): number {
  if (poolSize <= 0) {
    throw new Error("dailyIndexForDate: poolSize must be > 0");
  }
  const digest = createHash("sha256").update(dateKey).digest();
  // Use the first 4 bytes as an unsigned 32-bit integer.
  const value = digest.readUInt32BE(0);
  return value % poolSize;
}
