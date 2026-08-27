import { describe, expect, it } from "vitest";
import { compareWeaponType, mapWeaponCategory } from "@/lib/game/weaponMatching";

describe("compareWeaponType", () => {
  it("returns correct for the same weapon", () => {
    expect(
      compareWeaponType(
        { weapon: "AK-47", weaponCategory: "rifle" },
        { weapon: "AK-47", weaponCategory: "rifle" },
      ),
    ).toBe("correct");
  });

  it("returns partial for a different weapon in the same family", () => {
    expect(
      compareWeaponType(
        { weapon: "M4A1-S", weaponCategory: "rifle" },
        { weapon: "AK-47", weaponCategory: "rifle" },
      ),
    ).toBe("partial");
    expect(
      compareWeaponType(
        { weapon: "Glock-18", weaponCategory: "pistol" },
        { weapon: "USP-S", weaponCategory: "pistol" },
      ),
    ).toBe("partial");
  });

  it("returns incorrect across families", () => {
    expect(
      compareWeaponType(
        { weapon: "Glock-18", weaponCategory: "pistol" },
        { weapon: "AK-47", weaponCategory: "rifle" },
      ),
    ).toBe("incorrect");
    expect(
      compareWeaponType(
        { weapon: "Karambit", weaponCategory: "knife" },
        { weapon: "Sport Gloves", weaponCategory: "gloves" },
      ),
    ).toBe("incorrect");
  });

  it("treats two different knives as a partial match", () => {
    expect(
      compareWeaponType(
        { weapon: "Karambit", weaponCategory: "knife" },
        { weapon: "Bayonet", weaponCategory: "knife" },
      ),
    ).toBe("partial");
  });
});

describe("mapWeaponCategory", () => {
  it("maps the upstream category names", () => {
    expect(mapWeaponCategory("Rifles")).toBe("rifle");
    expect(mapWeaponCategory("Pistols")).toBe("pistol");
    expect(mapWeaponCategory("SMGs")).toBe("smg");
    expect(mapWeaponCategory("Knives")).toBe("knife");
    expect(mapWeaponCategory("Gloves")).toBe("gloves");
    expect(mapWeaponCategory("Heavy")).toBe("heavy");
  });

  it("returns null for an unrecognised category rather than guessing", () => {
    expect(mapWeaponCategory("Stickers")).toBeNull();
  });
});
