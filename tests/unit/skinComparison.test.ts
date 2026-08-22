import { describe, expect, it } from "vitest";
import { compareSkin, isWinningGuess } from "@/lib/game/skinComparison";
import type { NormalizedSkin } from "@/lib/game/types";

function makeSkin(overrides: Partial<NormalizedSkin> = {}): NormalizedSkin {
  return {
    id: "skin-1",
    name: "Redline",
    weapon: "AK-47",
    displayName: "AK-47 | Redline",
    imageUrl: "https://example.com/img.png",
    rarity: "classified",
    caseOrCollection: "Operation Phoenix Weapon Case",
    caseType: "case",
    wear: "field_tested",
    color: "red",
    isKnife: false,
    isGlove: false,
    ...overrides,
  };
}

describe("compareSkin", () => {
  it("marks every attribute correct for an identical skin", () => {
    const target = makeSkin();
    const result = compareSkin(makeSkin(), target);
    expect(result).toEqual({
      color: "correct",
      wear: "correct",
      case: "correct",
      rarity: "correct",
      knife: "correct",
    });
    expect(isWinningGuess(result)).toBe(true);
  });

  it("scores each attribute independently", () => {
    const target = makeSkin({ color: "red", wear: "field_tested", rarity: "covert", caseOrCollection: "Chroma Case" });
    const guess = makeSkin({ color: "orange", wear: "minimal_wear", rarity: "classified", caseOrCollection: "Gamma Case" });
    const result = compareSkin(guess, target);
    expect(result.color).toBe("partial");
    expect(result.wear).toBe("partial");
    expect(result.rarity).toBe("partial");
    expect(result.case).toBe("incorrect");
    expect(isWinningGuess(result)).toBe(false);
  });

  it("compares knife status as a strict boolean, independent of other attributes", () => {
    const target = makeSkin({ isKnife: true });
    const guess = makeSkin({ isKnife: false });
    expect(compareSkin(guess, target).knife).toBe("incorrect");
    expect(compareSkin(makeSkin({ isKnife: true }), target).knife).toBe("correct");
  });
});
