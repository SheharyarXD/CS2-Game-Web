import type { YearComparison } from "./types";

/**
 * Release-year comparison rules.
 *
 * The year compared is the year the skin ORIGINALLY shipped — the release
 * of its first container, not of a later case that happened to include it
 * again, and not the date it was imported here. See
 * scripts/lib/normalizeSkin.ts for how that value is resolved.
 *
 * Arrow convention, per the client's spec: the arrow describes where the
 * GUESS sits relative to the target.
 *
 *   guess year > target year  ->  "up"    (▲)
 *   guess year < target year  ->  "down"  (▼)
 *   guess year = target year  ->  green, no arrow
 *
 * Note this is the reverse of the "which way should I move" convention
 * some guessing games use. It is deliberate and matches the written
 * requirement; the cell also carries a text label so the direction is
 * never ambiguous to a player.
 *
 * A skin whose year could not be determined is stored as null rather than
 * being given an invented year. Two nulls compare equal, which preserves
 * the hard invariant that guessing the exact target always scores every
 * attribute "correct". A known year against an unknown one is "incorrect"
 * with no arrow, because there is no honest direction to point.
 */
export function compareYear(guessYear: number | null, targetYear: number | null): YearComparison {
  if (guessYear === null || targetYear === null) {
    const bothUnknown = guessYear === null && targetYear === null;
    return { state: bothUnknown ? "correct" : "incorrect", direction: null };
  }
  if (guessYear === targetYear) return { state: "correct", direction: null };
  return { state: "incorrect", direction: guessYear > targetYear ? "up" : "down" };
}
