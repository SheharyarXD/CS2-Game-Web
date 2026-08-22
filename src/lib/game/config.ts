// Centralized gameplay configuration. Nothing in the game-logic or UI layers
// should hardcode these values directly — change behavior here.
import type { ClueKey, RarityKey, WearKey } from "./types";

export const gameConfig = {
  /** Skin mode has no guess cap unless the client asks for one later. */
  skinMode: {
    maxGuesses: null as number | null,
    clues: ["case", "rarity", "color"] as ClueKey[],
    /** Each clue can only be revealed once per game session. */
    clueRevealLimit: 1,
  },
  mapMode: {
    maxGuesses: 11,
    /** Percent of the image revealed after each incorrect guess (cumulative). */
    revealPercentPerGuess: 5,
    /** Visible from the very first attempt, before any guess is made. */
    startingRevealPercent: 5,
  },
  /** Daily challenge resets at 00:00 UTC. */
  daily: {
    timezone: "UTC",
  },
} as const;

/** Ordered worst→best is NOT used; canonical order follows in-game UI convention. */
export const WEAR_ORDER: WearKey[] = [
  "factory_new",
  "minimal_wear",
  "field_tested",
  "well_worn",
  "battle_scarred",
];

export const WEAR_LABELS: Record<WearKey, string> = {
  factory_new: "Factory New",
  minimal_wear: "Minimal Wear",
  field_tested: "Field-Tested",
  well_worn: "Well-Worn",
  battle_scarred: "Battle-Scarred",
};

export const RARITY_ORDER: RarityKey[] = [
  "consumer",
  "industrial",
  "milspec",
  "restricted",
  "classified",
  "covert",
  "extraordinary",
];

export const RARITY_LABELS: Record<RarityKey, string> = {
  consumer: "Consumer Grade",
  industrial: "Industrial Grade",
  milspec: "Mil-Spec Grade",
  restricted: "Restricted",
  classified: "Classified",
  covert: "Covert",
  extraordinary: "Extraordinary",
};
