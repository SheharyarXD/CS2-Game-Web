import { describe, expect, it } from "vitest";
import { compareWear } from "@/lib/game/wearMatching";

describe("compareWear", () => {
  it("returns correct for an exact match", () => {
    expect(compareWear("field_tested", "field_tested")).toBe("correct");
  });

  it("returns partial for adjacent wear tiers", () => {
    expect(compareWear("minimal_wear", "factory_new")).toBe("partial");
    expect(compareWear("field_tested", "minimal_wear")).toBe("partial");
  });

  it("returns incorrect for wear tiers two or more steps apart", () => {
    expect(compareWear("factory_new", "field_tested")).toBe("incorrect");
    expect(compareWear("factory_new", "battle_scarred")).toBe("incorrect");
  });
});
