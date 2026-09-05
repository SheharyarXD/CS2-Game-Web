import { describe, expect, it } from "vitest";
import { CLUE_KEYS, clueUnlocksAfter, gameConfig } from "@/lib/game/config";
import type { ClueKey } from "@/lib/game/types";

/**
 * The clue order and thresholds are contractual: Case at 3 guesses,
 * Rarity at 5, Colour at 7. These tests exist so a future change to the
 * config can't silently drift away from what was agreed.
 */
describe("clue configuration", () => {
  it("offers exactly three clues, in the agreed order", () => {
    expect(CLUE_KEYS).toEqual<ClueKey[]>(["collection", "rarity", "color"]);
  });

  it("unlocks Case after 3 guesses, Rarity after 5 and Colour after 7", () => {
    expect(clueUnlocksAfter("collection")).toBe(3);
    expect(clueUnlocksAfter("rarity")).toBe(5);
    expect(clueUnlocksAfter("color")).toBe(7);
  });

  it("keeps the thresholds strictly increasing so clues arrive in order", () => {
    const thresholds = gameConfig.skinMode.clues.map((c) => c.unlocksAfter);
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]!).toBeGreaterThan(thresholds[i - 1]!);
    }
  });

  it("does not offer wear as a clue, and does not cap skin guesses", () => {
    expect(CLUE_KEYS).not.toContain("wear");
    expect(gameConfig.skinMode.maxGuesses).toBeNull();
  });
});
