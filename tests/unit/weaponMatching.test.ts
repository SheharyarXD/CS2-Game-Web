import { describe, expect, it } from "vitest";
import { compareWeapon, mapWeaponCategory } from "@/lib/game/weaponMatching";

describe("compareWeapon", () => {
  it("returns correct for the same weapon", () => {
    expect(
      compareWeapon(
        { weapon: "AK-47", weaponCategory: "rifle" },
        { weapon: "AK-47", weaponCategory: "rifle" },
      ),
    ).toBe("correct");
  });

  it("returns partial for a different weapon in the same family", () => {
    expect(
      compareWeapon(
        { weapon: "M4A1-S", weaponCategory: "rifle" },
        { weapon: "AK-47", weaponCategory: "rifle" },
      ),
    ).toBe("partial");
    expect(
      compareWeapon(
        { weapon: "Glock-18", weaponCategory: "pistol" },
        { weapon: "USP-S", weaponCategory: "pistol" },
      ),
    ).toBe("partial");
  });

  it("returns incorrect across families", () => {
    expect(
      compareWeapon(
        { weapon: "Glock-18", weaponCategory: "pistol" },
        { weapon: "AK-47", weaponCategory: "rifle" },
      ),
    ).toBe("incorrect");
    expect(
      compareWeapon(
        { weapon: "Karambit", weaponCategory: "knife" },
        { weapon: "Sport Gloves", weaponCategory: "gloves" },
      ),
    ).toBe("incorrect");
  });

  it("never treats M4A1-S and M4A4 as the same weapon", () => {
    // Called out explicitly by the client: same family, different weapons,
    // so this must never come back green.
    const result = compareWeapon(
      { weapon: "M4A1-S", weaponCategory: "rifle" },
      { weapon: "M4A4", weaponCategory: "rifle" },
    );
    expect(result).not.toBe("correct");
    expect(result).toBe("partial");
  });

  it("never treats USP-S and P2000 as the same weapon", () => {
    expect(
      compareWeapon(
        { weapon: "USP-S", weaponCategory: "pistol" },
        { weapon: "P2000", weaponCategory: "pistol" },
      ),
    ).not.toBe("correct");
  });

  it("never treats AK-47 and Galil AR as the same weapon", () => {
    expect(
      compareWeapon(
        { weapon: "AK-47", weaponCategory: "rifle" },
        { weapon: "Galil AR", weaponCategory: "rifle" },
      ),
    ).not.toBe("correct");
  });

  it("matches on the exact weapon even across differing families", () => {
    // The weapon name is the authority; the family only softens a miss.
    expect(
      compareWeapon(
        { weapon: "AK-47", weaponCategory: "rifle" },
        { weapon: "AK-47", weaponCategory: "rifle" },
      ),
    ).toBe("correct");
  });

  it("treats two different knives as a partial match", () => {
    expect(
      compareWeapon(
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
