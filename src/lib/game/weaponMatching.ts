import type { MatchState, WeaponCategory } from "./types";

/**
 * Weapon type comparison rules.
 *
 * This replaces the old knife yes/no attribute with the specific weapon
 * the skin belongs to (AK-47, Glock-18, M4A4, M4A1-S, USP-S, ...).
 *
 *  - Same weapon                                  -> "correct"
 *  - Different weapon, same family (both rifles,
 *    both pistols, both knives, ...)              -> "partial"
 *  - Different family                             -> "incorrect"
 *
 * The partial rule keeps the attribute useful: learning that the target
 * is "some pistol" narrows the pool without giving the answer away.
 */
export function compareWeaponType(
  guess: { weapon: string; weaponCategory: WeaponCategory },
  target: { weapon: string; weaponCategory: WeaponCategory },
): MatchState {
  if (guess.weapon === target.weapon) return "correct";
  if (guess.weaponCategory === target.weaponCategory) return "partial";
  return "incorrect";
}

export const WEAPON_CATEGORY_LABELS: Record<WeaponCategory, string> = {
  rifle: "Rifle",
  pistol: "Pistol",
  smg: "SMG",
  heavy: "Heavy",
  knife: "Knife",
  gloves: "Gloves",
};

/** Maps the upstream dataset's category name onto our weapon families. */
export function mapWeaponCategory(sourceCategory: string): WeaponCategory | null {
  switch (sourceCategory) {
    case "Rifles":
      return "rifle";
    case "Pistols":
      return "pistol";
    case "SMGs":
      return "smg";
    case "Heavy":
    case "Heavys":
    case "Shotguns":
    case "Machineguns":
      return "heavy";
    case "Knives":
      return "knife";
    case "Gloves":
      return "gloves";
    default:
      return null;
  }
}
