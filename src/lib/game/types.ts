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
  /**
   * The container the skin was FIRST released in. A Rare Special Item can
   * be dropped from several cases over the years; the comparison always
   * uses the earliest one. See scripts/lib/normalizeSkin.ts.
   */
  caseOrCollection: string | null;
  caseType: CaseType;
  /** Year that original container shipped. Null when it cannot be determined. */
  releaseYear: number | null;
  color: ColorKey;
  weaponCategory: WeaponCategory;
  isKnife: boolean;
  isGlove: boolean;
}

export type MatchState = "correct" | "partial" | "incorrect";

/**
 * Which way the guessed year sits relative to the target's.
 *
 * The arrow describes the GUESS, not the direction to move: a guess from a
 * later year than the target shows "up". Null when the two are equal, or
 * when either year is unknown and no honest comparison can be drawn.
 */
export type YearDirection = "up" | "down" | null;

export interface YearComparison {
  state: MatchState;
  direction: YearDirection;
}

/**
 * The compared attributes, in the order they are shown to the player:
 * weapon, collection, rarity, year. Year is always last.
 *
 * Wear was retired as a category at the client's request and Weapon now
 * carries the exact weapon (AK-47, M4A1-S, ...) rather than its family.
 */
export interface SkinComparisonResult {
  weapon: MatchState;
  collection: MatchState;
  rarity: MatchState;
  year: YearComparison;
}

export type GameMode = "DAILY_SKIN" | "UNLIMITED_SKIN" | "MAP";
export type GameStatus = "IN_PROGRESS" | "WON" | "LOST";

/**
 * Clue order is fixed by the agreed spec: Case/Collection, then Rarity,
 * then Colour. Colour is a clue only — it is deliberately not one of the
 * compared attributes (see SkinComparisonResult).
 */
export type ClueKey = "collection" | "rarity" | "color";

export interface NormalizedMap {
  id: string;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}
