// Shared domain types for the game/comparison layer. Kept independent of
// Prisma's generated types so the comparison engine is a pure, portable
// module (see skinComparison.ts) that can be unit tested without a database.

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
  isKnife: boolean;
  isGlove: boolean;
}

export type MatchState = "correct" | "partial" | "incorrect";
export type BinaryMatchState = "correct" | "incorrect";

export interface SkinComparisonResult {
  color: MatchState;
  wear: MatchState;
  case: MatchState;
  rarity: MatchState;
  knife: BinaryMatchState;
}

export type GameMode = "DAILY_SKIN" | "UNLIMITED_SKIN" | "MAP";
export type GameStatus = "IN_PROGRESS" | "WON" | "LOST";

export type ClueKey = "case" | "rarity" | "color";

export interface NormalizedMap {
  id: string;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}
