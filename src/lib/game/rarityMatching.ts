import { RARITY_ORDER } from "./config";
import type { MatchState, RarityKey } from "./types";

/**
 * Rarity comparison rules.
 *
 * Rarity is treated as an ordered scale (Consumer Grade -> Extraordinary,
 * matching CS2's own progression). As with wear, the client left the exact
 * partial-match definition open, so this module implements a clear,
 * deterministic rule documented here:
 *
 *  - Same rarity tier                    -> "correct"
 *  - Adjacent tier (±1 on the scale)      -> "partial"
 *  - Two or more tiers apart              -> "incorrect"
 */
export function compareRarity(guess: RarityKey, target: RarityKey): MatchState {
  const guessIndex = RARITY_ORDER.indexOf(guess);
  const targetIndex = RARITY_ORDER.indexOf(target);
  const distance = Math.abs(guessIndex - targetIndex);

  if (distance === 0) return "correct";
  if (distance === 1) return "partial";
  return "incorrect";
}
