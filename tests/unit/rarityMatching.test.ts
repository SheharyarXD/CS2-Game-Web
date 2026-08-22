import { describe, expect, it } from "vitest";
import { compareRarity } from "@/lib/game/rarityMatching";

describe("compareRarity", () => {
  it("returns correct for an exact match", () => {
    expect(compareRarity("covert", "covert")).toBe("correct");
  });

  it("returns partial for adjacent rarity tiers", () => {
    expect(compareRarity("classified", "covert")).toBe("partial");
    expect(compareRarity("restricted", "classified")).toBe("partial");
  });

  it("returns incorrect for rarity tiers two or more steps apart", () => {
    expect(compareRarity("consumer", "covert")).toBe("incorrect");
    expect(compareRarity("milspec", "extraordinary")).toBe("incorrect");
  });
});
