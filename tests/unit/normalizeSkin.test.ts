import { describe, expect, it } from "vitest";
import {
  cleanDisplayName,
  deterministicIndex,
  mapRarity,
  mapWear,
  pickCanonicalWear,
  pickCaseOrCollection,
} from "../../scripts/lib/normalizeSkin";
import type { RawSkin } from "../../scripts/lib/rawSkinTypes";

describe("mapRarity / mapWear", () => {
  it("maps known upstream rarity/wear names to internal keys", () => {
    expect(mapRarity("Covert")).toBe("covert");
    expect(mapRarity("Mil-Spec Grade")).toBe("milspec");
    expect(mapWear("Factory New")).toBe("factory_new");
    expect(mapWear("Battle-Scarred")).toBe("battle_scarred");
  });

  it("returns null for unrecognized names instead of guessing", () => {
    expect(mapRarity("Ultra Rare")).toBeNull();
    expect(mapWear("Brand New")).toBeNull();
  });
});

describe("deterministicIndex", () => {
  it("is stable across calls for the same input", () => {
    expect(deterministicIndex("skin-91a429af4a60", 5)).toBe(deterministicIndex("skin-91a429af4a60", 5));
  });

  it("stays within [0, size)", () => {
    for (const id of ["a", "b", "c", "d", "e"]) {
      const index = deterministicIndex(id, 3);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(3);
    }
  });
});

describe("pickCanonicalWear", () => {
  it("only ever picks a wear the skin can actually drop in", () => {
    const wears = [{ id: "w1", name: "Minimal Wear" }, { id: "w2", name: "Field-Tested" }];
    const wear = pickCanonicalWear("skin-abc", wears);
    expect(["minimal_wear", "field_tested"]).toContain(wear);
  });

  it("returns null when there are no mappable wears", () => {
    expect(pickCanonicalWear("skin-abc", [])).toBeNull();
  });

  it("is deterministic for the same skin id", () => {
    const wears = [{ id: "w1", name: "Minimal Wear" }, { id: "w2", name: "Field-Tested" }, { id: "w3", name: "Well-Worn" }];
    expect(pickCanonicalWear("skin-xyz", wears)).toBe(pickCanonicalWear("skin-xyz", wears));
  });
});

function makeRawSkin(overrides: Partial<RawSkin> = {}): RawSkin {
  return {
    id: "skin-91a429af4a60",
    name: "AK-47 | Redline",
    weapon: { id: "weapon_ak47", weapon_id: 7, name: "AK-47" },
    category: { id: "csgo_inventory_weapon_category_rifles", name: "Rifles" },
    pattern: { id: "cu_ak47_cobra", name: "Redline" },
    rarity: { id: "rarity_legendary_weapon", name: "Classified", color: "#d32ce6" },
    stattrak: true,
    souvenir: true,
    wears: [{ id: "w1", name: "Minimal Wear" }],
    collections: [{ id: "collection-set-community-2", name: "The Phoenix Collection", image: "" }],
    crates: [{ id: "crate-4011", name: "Operation Phoenix Weapon Case", image: "" }],
    image: "https://example.com/img.png",
    ...overrides,
  };
}

describe("cleanDisplayName", () => {
  it("strips the knife/glove star prefix", () => {
    expect(cleanDisplayName("★ Karambit | Doppler")).toBe("Karambit | Doppler");
    expect(cleanDisplayName("AK-47 | Redline")).toBe("AK-47 | Redline");
  });
});

describe("pickCaseOrCollection", () => {
  it("prefers a real case over a collection when both are present", () => {
    const result = pickCaseOrCollection(makeRawSkin());
    expect(result).toEqual({ caseOrCollection: "Operation Phoenix Weapon Case", caseType: "case" });
  });

  it("excludes Souvenir Package crates and falls back to the collection", () => {
    const raw = makeRawSkin({
      crates: [{ id: "crate-x", name: "Rio 2022 Ancient Souvenir Package", image: "" }],
    });
    const result = pickCaseOrCollection(raw);
    expect(result).toEqual({ caseOrCollection: "The Phoenix Collection", caseType: "collection" });
  });

  it("returns nulls when neither a case nor a collection is known", () => {
    const raw = makeRawSkin({ crates: [], collections: [] });
    expect(pickCaseOrCollection(raw)).toEqual({ caseOrCollection: null, caseType: null });
  });
});
