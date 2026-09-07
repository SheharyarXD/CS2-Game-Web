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
    releaseYear: 2014,
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
      weapon: "correct",
      collection: "correct",
      rarity: "correct",
      year: { state: "correct", direction: null },
    });
    expect(allAttributesMatch(result)).toBe(true);
  });

  it("reports the four categories in the agreed order, with year last", () => {
    expect(Object.keys(compareSkin(makeSkin(), makeSkin()))).toEqual([
      "weapon",
      "collection",
      "rarity",
      "year",
    ]);
  });

  it("scores each attribute independently", () => {
    const target = makeSkin({ weapon: "AK-47", rarity: "covert", caseOrCollection: "Chroma Case", releaseYear: 2015 });
    const guess = makeSkin({ weapon: "M4A4", rarity: "classified", caseOrCollection: "Gamma Case", releaseYear: 2016 });
    const result = compareSkin(guess, target);
    expect(result.weapon).toBe("partial"); // different rifle
    expect(result.rarity).toBe("partial"); // adjacent tier
    expect(result.collection).toBe("incorrect");
    expect(result.year).toEqual({ state: "incorrect", direction: "up" });
    expect(allAttributesMatch(result)).toBe(false);
  });

  it("does not compare colour, which is a clue only", () => {
    const result = compareSkin(makeSkin({ color: "blue" }), makeSkin({ color: "red" }));
    expect(result).not.toHaveProperty("color");
    expect(allAttributesMatch(result)).toBe(true);
  });

  it("does not compare wear, which was retired as a category", () => {
    expect(compareSkin(makeSkin(), makeSkin())).not.toHaveProperty("wear");
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

  it("still matches every attribute when the target has no known release year", () => {
    // The invariant that guessing the target scores all-correct has to hold
    // even for a skin whose year could not be determined.
    const undated = makeSkin({ releaseYear: null });
    expect(allAttributesMatch(compareSkin(undated, undated))).toBe(true);
  });

  it("can report all four attributes matching for two genuinely different skins", () => {
    // This is why the win condition is decided by skin identity rather than
    // by the comparison result. Two rifles from the same collection at the
    // same rarity and release year score all-correct without being the same
    // skin.
    const target = makeSkin({ id: "skin-a", weapon: "AK-47", name: "Redline" });
    const other = makeSkin({ id: "skin-b", weapon: "AK-47", name: "Point Disarray" });
    expect(allAttributesMatch(compareSkin(other, target))).toBe(true);
    expect(other.id).not.toBe(target.id);
  });
});
