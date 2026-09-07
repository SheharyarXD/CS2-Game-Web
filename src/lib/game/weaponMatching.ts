import type { MatchState, WeaponCategory } from "./types";

/**
 * Weapon comparison rules.
 *
 * The category is the EXACT weapon the skin belongs to — AK-47, M4A4,
 * M4A1-S, Glock-18, USP-S, Karambit — and that exact name is what the
 * player sees in the column. The weapon family is only ever used to soften
 * a miss into a partial; it never stands in for the weapon itself.
 *
 *  - Same weapon                                  -> "correct"
 *  - Different weapon, same family (both rifles,
 *    both pistols, both knives, ...)              -> "partial"
 *  - Different family                             -> "incorrect"
 *
 * So M4A1-S against M4A4 is a partial, never a match: they are two
 * different weapons that happen to share a family. Likewise USP-S against
 * P2000, and AK-47 against Galil AR. The partial keeps the attribute
 * useful — learning the target is "some pistol" narrows the pool without
 * giving the answer away — while still holding the line that only the same
 * weapon scores green.
 */
export function compareWeapon(
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
