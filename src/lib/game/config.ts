// Centralized gameplay configuration. Nothing in the game-logic or UI layers
// should hardcode these values directly — change behavior here.
import type { ClueKey, RarityKey, WearKey } from "./types";

export const gameConfig = {
  /** Skin mode has no guess cap unless the client asks for one later. */
  skinMode: {
    maxGuesses: null as number | null,
    /**
     * Clues unlock progressively as the player uses up guesses, weakest
     * hint first. `unlocksAfter` is the number of guesses that must be
     * submitted before the clue can be revealed.
     */
    clues: [
      { key: "wear" as ClueKey, unlocksAfter: 3 },
      { key: "rarity" as ClueKey, unlocksAfter: 5 },
      { key: "collection" as ClueKey, unlocksAfter: 7 },
    ],
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

/** Clue keys in display order. */
export const CLUE_KEYS: ClueKey[] = gameConfig.skinMode.clues.map((c) => c.key);

export function clueUnlocksAfter(key: ClueKey): number {
  return gameConfig.skinMode.clues.find((c) => c.key === key)?.unlocksAfter ?? 0;
}

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
  "contraband",
  "extraordinary",
];

export const RARITY_LABELS: Record<RarityKey, string> = {
  consumer: "Consumer Grade",
  industrial: "Industrial Grade",
  milspec: "Mil-Spec Grade",
  restricted: "Restricted",
  classified: "Classified",
  covert: "Covert",
  // Valve's one-off rarity for skins pulled from cases (e.g. M4A4 | Howl).
  contraband: "Contraband",
  // Knives and gloves. In game these are shown as "Rare Special Item"
  // rather than "Extraordinary"; the stored key is left unchanged so the
  // existing imported data stays valid.
  extraordinary: "Rare Special Item",
};

/**
 * In-game rarity colours, used for the rarity cell and the search list.
 * `sparkle` marks the gold tier, which the UI renders with a shimmer.
 */
export const RARITY_COLORS: Record<RarityKey, { text: string; border: string; bg: string; sparkle?: boolean }> = {
  consumer: { text: "#c3ced9", border: "#6b7a88", bg: "rgba(176,195,217,0.10)" },
  industrial: { text: "#7ab0e6", border: "#3f6f9e", bg: "rgba(94,152,217,0.12)" },
  milspec: { text: "#7d92ff", border: "#3a4bb5", bg: "rgba(75,105,255,0.14)" },
  restricted: { text: "#b07dff", border: "#6a34c4", bg: "rgba(136,71,255,0.14)" },
  classified: { text: "#ee5ff5", border: "#a021b0", bg: "rgba(211,44,230,0.14)" },
  covert: { text: "#ff6b6b", border: "#b23636", bg: "rgba(235,75,75,0.15)" },
  contraband: { text: "#f0c14b", border: "#a8801f", bg: "rgba(228,174,57,0.15)" },
  // Rare Special Item. Sampled from the in-game gold medal art: deep
  // bronze edge, saturated mid-gold, bright highlight. Rendered as a
  // metallic gradient with a moving sheen rather than a flat tint — see
  // `.rarity-gold` in globals.css.
  extraordinary: { text: "#fdf0be", border: "#8f6b18", bg: "rgba(201,160,42,0.22)", sparkle: true },
};
