import type { ColorKey, MatchState } from "./types";

/**
 * Color comparison rules.
 *
 * The upstream skin dataset has no "main color" field (it only carries a
 * rarity color, which is a UI accent, not the skin's visual color). Colors
 * are instead derived once at import time from the skin's actual render —
 * see scripts/lib/extractDominantColor.ts — and classified into one of the
 * buckets below. That classification is deterministic (same image always
 * yields the same bucket) and is stored on the Skin record, never recomputed
 * per-request.
 *
 * Matching semantics:
 *  - EXACT bucket match                -> "correct"
 *  - Buckets are adjacent on the wheel  -> "partial"
 *  - Otherwise                         -> "incorrect"
 *
 * Adjacency is modeled as a color wheel plus a neutral/metallic side-chain
 * (black-gray-white) and browns/gold bridging into the warm side of the
 * wheel. "multicolor" is deliberately excluded from every adjacency list:
 * a multicolor skin has no single dominant hue to be "close" to, so it only
 * ever matches itself exactly. This table is the single source of truth —
 * change relationships here, not in UI code.
 */
const COLOR_ADJACENCY: Record<ColorKey, ColorKey[]> = {
  red: ["orange", "pink"],
  orange: ["red", "yellow", "brown", "gold"],
  yellow: ["orange", "green", "gold"],
  green: ["yellow", "blue"],
  blue: ["green", "purple"],
  purple: ["blue", "pink"],
  pink: ["purple", "red"],
  black: ["gray"],
  white: ["gray"],
  gray: ["black", "white"],
  brown: ["orange", "black"],
  gold: ["yellow", "orange"],
  multicolor: [],
};

export function compareColor(guess: ColorKey, target: ColorKey): MatchState {
  if (guess === target) return "correct";
  if (COLOR_ADJACENCY[target].includes(guess)) return "partial";
  return "incorrect";
}

export const COLOR_LABELS: Record<ColorKey, string> = {
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
  pink: "Pink",
  black: "Black",
  white: "White",
  gray: "Gray",
  brown: "Brown",
  gold: "Gold",
  multicolor: "Multicolor",
};

/** Swatch used by the UI for the color clue / comparison cells. */
export const COLOR_SWATCH: Record<ColorKey, string> = {
  red: "#c0392b",
  orange: "#d9782d",
  yellow: "#d9c22d",
  green: "#4c9a4c",
  blue: "#3d6fd9",
  purple: "#7c4cd9",
  pink: "#d94c9c",
  black: "#1c1c1c",
  white: "#e8e8e8",
  gray: "#8a8a8a",
  brown: "#7a5231",
  gold: "#c9a04a",
  multicolor: "conic-gradient(from 0deg, #c0392b, #d9c22d, #4c9a4c, #3d6fd9, #7c4cd9, #c0392b)",
};
