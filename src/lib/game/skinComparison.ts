import { compareCase } from "./caseMatching";
import { compareColor } from "./colorMatching";
import { compareRarity } from "./rarityMatching";
import type { NormalizedSkin, SkinComparisonResult } from "./types";
import { compareWear } from "./wearMatching";

/**
 * The single source of truth for how a guessed skin is scored against the
 * target skin. This is a pure function with no UI or persistence concerns —
 * components only render whatever this returns (see requirement: comparison
 * logic must not live inside React components).
 */
export function compareSkin(guess: NormalizedSkin, target: NormalizedSkin): SkinComparisonResult {
  return {
    color: compareColor(guess.color, target.color),
    wear: compareWear(guess.wear, target.wear),
    case: compareCase(guess, target),
    rarity: compareRarity(guess.rarity, target.rarity),
    knife: guess.isKnife === target.isKnife ? "correct" : "incorrect",
  };
}

export function isWinningGuess(result: SkinComparisonResult): boolean {
  return (
    result.color === "correct" &&
    result.wear === "correct" &&
    result.case === "correct" &&
    result.rarity === "correct" &&
    result.knife === "correct"
  );
}
