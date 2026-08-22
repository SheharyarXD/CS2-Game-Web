import { WEAR_ORDER } from "./config";
import type { MatchState, WearKey } from "./types";

/**
 * Wear comparison rules.
 *
 * Wear is treated as an ordered scale (Factory New -> Battle-Scarred).
 * The client did not specify partial-match semantics, so this module
 * implements the most intuitive deterministic rule and documents it here
 * so it can be swapped out without touching any UI code:
 *
 *  - Same wear                          -> "correct"
 *  - Adjacent on the FN..BS scale (±1)   -> "partial"
 *  - Two or more steps apart             -> "incorrect"
 */
export function compareWear(guess: WearKey, target: WearKey): MatchState {
  const guessIndex = WEAR_ORDER.indexOf(guess);
  const targetIndex = WEAR_ORDER.indexOf(target);
  const distance = Math.abs(guessIndex - targetIndex);

  if (distance === 0) return "correct";
  if (distance === 1) return "partial";
  return "incorrect";
}
