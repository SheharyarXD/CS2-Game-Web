import { describe, expect, it } from "vitest";
import { allAttributesMatch, compareSkin } from "@/lib/game/skinComparison";
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
    weaponCategory: "rifle",
    isKnife: false,
    isGlove: false,
    ...overrides,
  };
}

describe("compareSkin", () => {
  it("marks every attribute correct for an identical skin", () => {
    const result = compareSkin(makeSkin(), makeSkin());
    expect(result).toEqual({
      wear: "correct",
      collection: "correct",
      rarity: "correct",
      weaponType: "correct",
    });
    expect(allAttributesMatch(result)).toBe(true);
  });

  it("scores each attribute independently", () => {
    const target = makeSkin({ wear: "field_tested", rarity: "covert", caseOrCollection: "Chroma Case" });
    const guess = makeSkin({ wear: "minimal_wear", rarity: "classified", caseOrCollection: "Gamma Case" });
    const result = compareSkin(guess, target);
    expect(result.wear).toBe("partial");
    expect(result.rarity).toBe("partial");
    expect(result.collection).toBe("incorrect");
    expect(allAttributesMatch(result)).toBe(false);
  });

  it("does not compare colour, which was retired as a category", () => {
    const result = compareSkin(makeSkin({ color: "blue" }), makeSkin({ color: "red" }));
    expect(result).not.toHaveProperty("color");
    expect(allAttributesMatch(result)).toBe(true);
  });

  it("still matches every attribute when the target has no known collection", () => {
    const howl = makeSkin({
      displayName: "M4A4 | Howl",
      weapon: "M4A4",
      rarity: "contraband",
      caseOrCollection: null,
      caseType: null,
    });
    expect(allAttributesMatch(compareSkin(howl, howl))).toBe(true);
  });

  it("can report all four attributes matching for two genuinely different skins", () => {
    // This is why the win condition is decided by skin identity rather than
    // by the comparison result. Two rifles from the same collection at the
    // same rarity and wear score all-correct without being the same skin.
    const target = makeSkin({ id: "skin-a", weapon: "AK-47", name: "Redline" });
    const other = makeSkin({ id: "skin-b", weapon: "AK-47", name: "Point Disarray" });
    expect(allAttributesMatch(compareSkin(other, target))).toBe(true);
    expect(other.id).not.toBe(target.id);
  });
});
