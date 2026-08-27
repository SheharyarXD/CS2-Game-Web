import { compareCase } from "./caseMatching";
import { compareRarity } from "./rarityMatching";
import type { NormalizedSkin, SkinComparisonResult } from "./types";
import { compareWear } from "./wearMatching";
import { compareWeaponType } from "./weaponMatching";

/**
 * The single source of truth for how a guessed skin is scored against the
 * target skin. This is a pure function with no UI or persistence concerns —
 * components only render whatever this returns (see requirement: comparison
 * logic must not live inside React components).
 *
 * Attributes, in the order the player sees them: wear, collection, rarity,
 * weapon type.
 */
export function compareSkin(guess: NormalizedSkin, target: NormalizedSkin): SkinComparisonResult {
  return {
    wear: compareWear(guess.wear, target.wear),
    collection: compareCase(guess, target),
    rarity: compareRarity(guess.rarity, target.rarity),
    weaponType: compareWeaponType(guess, target),
  };
}

/**
 * True when every compared attribute matches.
 *
 * This is NOT the win condition. With only four attributes, two different
 * skins can legitimately share all of them (two AK-47s from the same
 * collection at the same rarity and wear), so a win is decided by skin
 * identity in submitSkinGuess, not by this function. It is used purely to
 * tell the player they are extremely close.
 */
export function allAttributesMatch(result: SkinComparisonResult): boolean {
  return (
    result.wear === "correct" &&
    result.collection === "correct" &&
    result.rarity === "correct" &&
    result.weaponType === "correct"
  );
}
