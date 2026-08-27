// Shared domain types for the game/comparison layer. Kept independent of
// Prisma's generated types so the comparison engine is a pure, portable
// module (see skinComparison.ts) that can be unit tested without a database.

/**
 * Retained because the importer still derives a dominant colour for every
 * skin (see scripts/lib/extractDominantColor.ts). Colour is no longer one
 * of the compared attributes — skins vary too widely in palette for it to
 * be a fair category — but the data stays on the record so the category
 * could be reinstated without a re-import.
 */
export type ColorKey =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "black"
  | "white"
  | "gray"
  | "brown"
  | "gold"
  | "multicolor";

export type WearKey =
  | "factory_new"
  | "minimal_wear"
  | "field_tested"
  | "well_worn"
  | "battle_scarred";

export type RarityKey =
  | "consumer"
  | "industrial"
  | "milspec"
  | "restricted"
  | "classified"
  | "covert"
  | "contraband"
  | "extraordinary";

/** Broad weapon family, used for the partial match on weapon type. */
export type WeaponCategory = "rifle" | "pistol" | "smg" | "heavy" | "knife" | "gloves";

export type CaseType = "case" | "collection" | null;

/** A normalized, game-ready skin. This is what the comparison engine operates on. */
export interface NormalizedSkin {
  id: string;
  name: string;
  weapon: string;
  displayName: string;
  imageUrl: string;
  rarity: RarityKey;
  caseOrCollection: string | null;
  caseType: CaseType;
  wear: WearKey;
  color: ColorKey;
  weaponCategory: WeaponCategory;
  isKnife: boolean;
  isGlove: boolean;
}

export type MatchState = "correct" | "partial" | "incorrect";

/**
 * The compared attributes, in the order they are shown to the player:
 * wear, collection, rarity, weapon type.
 */
export interface SkinComparisonResult {
  wear: MatchState;
  collection: MatchState;
  rarity: MatchState;
  weaponType: MatchState;
}

export type GameMode = "DAILY_SKIN" | "UNLIMITED_SKIN" | "MAP";
export type GameStatus = "IN_PROGRESS" | "WON" | "LOST";

export type ClueKey = "wear" | "rarity" | "collection";

export interface NormalizedMap {
  id: string;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}
