import { compareCase } from "./caseMatching";
import { compareRarity } from "./rarityMatching";
import type { NormalizedSkin, SkinComparisonResult } from "./types";
import { compareWeapon } from "./weaponMatching";
import { compareYear } from "./yearMatching";

/**
 * The single source of truth for how a guessed skin is scored against the
 * target skin. This is a pure function with no UI or persistence concerns —
 * components only render whatever this returns (see requirement: comparison
 * logic must not live inside React components).
 *
 * Attributes, in the order the player sees them: weapon, collection,
 * rarity, year. Year is always the last column.
 */
export function compareSkin(guess: NormalizedSkin, target: NormalizedSkin): SkinComparisonResult {
  return {
    weapon: compareWeapon(guess, target),
    collection: compareCase(guess, target),
    rarity: compareRarity(guess.rarity, target.rarity),
    year: compareYear(guess.releaseYear, target.releaseYear),
  };
}

/**
 * True when every compared attribute matches.
 *
 * This is NOT the win condition. With only four attributes, two different
 * skins can legitimately share all of them (two AK-47s from the same
 * collection at the same rarity, released the same year), so a win is
 * decided by skin identity in submitSkinGuess, not by this function. It is
 * used purely to tell the player they are extremely close.
 */
export function allAttributesMatch(result: SkinComparisonResult): boolean {
  return (
    result.weapon === "correct" &&
    result.collection === "correct" &&
    result.rarity === "correct" &&
    result.year.state === "correct"
  );
}
