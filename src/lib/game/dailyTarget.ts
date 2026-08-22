import { createHash } from "node:crypto";

/**
 * Deterministic daily target selection.
 *
 * The daily skin is derived from the UTC calendar date, never chosen
 * client-side and never re-rolled on refresh: the same `dateKey` always
 * hashes to the same index for a given pool size. This module is
 * server-only (uses node:crypto) — it must only be imported from API
 * routes / server code, never from a "use client" component.
 */

/** Returns the current UTC calendar date as "YYYY-MM-DD". */
export function dateKeyUTC(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Milliseconds until the next UTC midnight (the daily reset moment). */
export function msUntilNextUtcMidnight(date: Date = new Date()): number {
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return next.getTime() - date.getTime();
}

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
