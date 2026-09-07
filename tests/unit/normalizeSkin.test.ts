import { describe, expect, it } from "vitest";
import {
  applyRareSpecialItem,
  buildContainerDates,
  cleanDisplayName,
  deterministicIndex,
  mapRarity,
  parseReleaseDate,
  pickOriginalRelease,
} from "../../scripts/lib/normalizeSkin";
import type { RawCollection, RawCrate, RawSkin } from "../../scripts/lib/rawSkinTypes";

describe("mapRarity", () => {
  it("maps known upstream rarity names to internal keys", () => {
    expect(mapRarity("Covert")).toBe("covert");
    expect(mapRarity("Mil-Spec Grade")).toBe("milspec");
    expect(mapRarity("Extraordinary")).toBe("extraordinary");
  });

  it("returns null for unrecognized names instead of guessing", () => {
    expect(mapRarity("Ultra Rare")).toBeNull();
  });
});

describe("applyRareSpecialItem", () => {
  it("forces knives to the gold Rare Special Item tier", () => {
    // The dataset labels knife finishes Covert; the category must win.
    expect(applyRareSpecialItem("covert", "knife")).toBe("extraordinary");
  });

  it("forces gloves to the gold tier too", () => {
    expect(applyRareSpecialItem("covert", "gloves")).toBe("extraordinary");
    expect(applyRareSpecialItem("extraordinary", "gloves")).toBe("extraordinary");
  });

  it("leaves ordinary weapon rarities untouched", () => {
    expect(applyRareSpecialItem("covert", "rifle")).toBe("covert");
    expect(applyRareSpecialItem("milspec", "pistol")).toBe("milspec");
    expect(applyRareSpecialItem("contraband", "rifle")).toBe("contraband");
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

describe("parseReleaseDate", () => {
  it("accepts both separator styles the upstream data uses", () => {
    expect(parseReleaseDate("2021-09-08")?.toISOString()).toBe("2021-09-08T00:00:00.000Z");
    expect(parseReleaseDate("2013/12/17")?.toISOString()).toBe("2013-12-17T00:00:00.000Z");
  });

  it("accepts single-digit months and days", () => {
    expect(parseReleaseDate("2014/1/8")?.toISOString()).toBe("2014-01-08T00:00:00.000Z");
  });

  it("returns null rather than guessing at a missing or malformed date", () => {
    expect(parseReleaseDate(null)).toBeNull();
    expect(parseReleaseDate(undefined)).toBeNull();
    expect(parseReleaseDate("")).toBeNull();
    expect(parseReleaseDate("sometime in 2015")).toBeNull();
  });
});

describe("cleanDisplayName", () => {
  it("strips the knife/glove star prefix", () => {
    expect(cleanDisplayName("★ Karambit | Doppler")).toBe("Karambit | Doppler");
    expect(cleanDisplayName("AK-47 | Redline")).toBe("AK-47 | Redline");
  });
});

// --- original release resolution -------------------------------------------

const CRATES: RawCrate[] = [
  { id: "crate-4790", name: "Operation Riptide Case", type: "Case", first_sale_date: "2021-09-08" },
  { id: "crate-4818", name: "Dreams & Nightmares Case", type: "Case", first_sale_date: "2021-11-17" },
  { id: "crate-4011", name: "Operation Phoenix Weapon Case", type: "Case", first_sale_date: "2014/02/20" },
  { id: "crate-undated", name: "Mystery Case", type: "Case", first_sale_date: null },
  { id: "crate-undated-2", name: "Other Mystery Case", type: "Case", first_sale_date: null },
];

const COLLECTIONS: RawCollection[] = [
  { id: "collection-set-community-2", name: "The Phoenix Collection", release_date: "2014-02-20" },
  { id: "collection-set-weapons-i", name: "The Arms Deal Collection", release_date: "2013-08-14" },
];

const cratesById = new Map(CRATES.map((c) => [c.id, c]));
const { crateDates, collectionDates } = buildContainerDates(CRATES, COLLECTIONS);

function crateRef(id: string) {
  return { id, name: cratesById.get(id)!.name, image: "" };
}

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
    crates: [crateRef("crate-4011")],
    image: "https://example.com/img.png",
    ...overrides,
  };
}

function resolve(raw: RawSkin) {
  return pickOriginalRelease(raw, crateDates, collectionDates);
}

describe("buildContainerDates", () => {
  it("reads each crate's own first_sale_date", () => {
    const { crateDates } = buildContainerDates(CRATES, COLLECTIONS);
    expect(crateDates.get("crate-4790")?.toISOString()).toBe("2021-09-08T00:00:00.000Z");
  });

  it("lets an undated crate inherit the date of the collection that ships it", () => {
    // The "Sealed ... Terminal" containers carry no date upstream, but the
    // collection they ship does, and collections.json names the link.
    const terminal: RawCrate = { id: "crate-5181", name: "Sealed Terminal", type: null, first_sale_date: null };
    const collection: RawCollection = {
      id: "collection-terminal",
      name: "The Terminal Collection",
      release_date: "2026-03-11",
      crates: [{ id: "crate-5181", name: "Sealed Terminal" }],
    };
    const { crateDates } = buildContainerDates([terminal], [collection]);
    expect(crateDates.get("crate-5181")?.toISOString()).toBe("2026-03-11T00:00:00.000Z");
  });

  it("never lets an inherited date override the crate's own", () => {
    const dated: RawCrate = { id: "crate-own", name: "Dated Case", type: "Case", first_sale_date: "2019-01-01" };
    const collection: RawCollection = {
      id: "collection-x",
      name: "Later Collection",
      release_date: "2024-01-01",
      crates: [{ id: "crate-own", name: "Dated Case" }],
    };
    const { crateDates } = buildContainerDates([dated], [collection]);
    expect(crateDates.get("crate-own")?.toISOString()).toBe("2019-01-01T00:00:00.000Z");
  });

  it("leaves a crate undated when nothing can date it", () => {
    const orphan: RawCrate = { id: "crate-orphan", name: "Orphan", type: null, first_sale_date: null };
    const { crateDates } = buildContainerDates([orphan], []);
    expect(crateDates.has("crate-orphan")).toBe(false);
  });
});

describe("pickOriginalRelease", () => {
  it("prefers a real case over a collection when both are present", () => {
    const result = resolve(makeRawSkin());
    expect(result.caseOrCollection).toBe("Operation Phoenix Weapon Case");
    expect(result.caseType).toBe("case");
    expect(result.releaseYear).toBe(2014);
  });

  it("excludes Souvenir Package crates and falls back to the collection", () => {
    const raw = makeRawSkin({
      crates: [{ id: "crate-x", name: "Rio 2022 Ancient Souvenir Package", image: "" }],
    });
    const result = resolve(raw);
    expect(result.caseOrCollection).toBe("The Phoenix Collection");
    expect(result.caseType).toBe("collection");
    expect(result.releaseYear).toBe(2014);
  });

  it("returns nulls when neither a case nor a collection is known", () => {
    const result = resolve(makeRawSkin({ crates: [], collections: [] }));
    expect(result.caseOrCollection).toBeNull();
    expect(result.caseType).toBeNull();
    expect(result.releaseYear).toBeNull();
    expect(result.containers).toEqual([]);
    expect(result.ambiguous).toBe(false);
  });

  // The client's worked example. A Rare Special Item in two cases must
  // compare against the one it was introduced in.
  it("picks the EARLIEST case for a Rare Special Item found in several", () => {
    const lore = makeRawSkin({
      id: "skin-b083e3da3e03",
      name: "★ Butterfly Knife | Lore",
      weapon: { id: "weapon_knife_butterfly", weapon_id: 515, name: "Butterfly Knife" },
      category: { id: "sfui_invpanel_filter_melee", name: "Knives" },
      pattern: { id: "am_gilded", name: "Lore" },
      collections: [],
      crates: [crateRef("crate-4790"), crateRef("crate-4818")],
    });
    const result = resolve(lore);
    expect(result.caseOrCollection).toBe("Operation Riptide Case");
    expect(result.releaseYear).toBe(2021);
    expect(result.sourceContainerId).toBe("crate-4790");
  });

  it("is not fooled by the dataset's ordering", () => {
    // Same two cases, listed newest-first. The answer must not change.
    const reversed = makeRawSkin({
      collections: [],
      crates: [crateRef("crate-4818"), crateRef("crate-4790")],
    });
    expect(resolve(reversed).caseOrCollection).toBe("Operation Riptide Case");
  });

  it("does not simply take the first, last or alphabetically-first case", () => {
    // Ordered so the earliest container (Phoenix, 2014) is none of the
    // three wrong answers: it sits in the middle of the list and sorts
    // second alphabetically.
    const raw = makeRawSkin({
      collections: [],
      crates: [crateRef("crate-4790"), crateRef("crate-4011"), crateRef("crate-4818")],
    });
    const result = resolve(raw);
    const names = raw.crates.map((c) => c.name);
    expect(result.caseOrCollection).not.toBe(names[0]); // not the first listed
    expect(result.caseOrCollection).not.toBe(names[names.length - 1]!); // not the last
    expect(result.caseOrCollection).not.toBe([...names].sort()[0]); // not alphabetical
    expect(result.caseOrCollection).toBe("Operation Phoenix Weapon Case"); // the earliest
  });

  it("keeps every container it saw, ordered earliest first", () => {
    const raw = makeRawSkin({ collections: [], crates: [crateRef("crate-4818"), crateRef("crate-4790")] });
    const result = resolve(raw);
    expect(result.containers.map((c) => c.name)).toEqual([
      "Operation Riptide Case",
      "Dreams & Nightmares Case",
    ]);
    expect(result.containers).toHaveLength(2);
  });

  it("works generically, not just for the Butterfly Lore example", () => {
    const other = makeRawSkin({
      name: "★ Karambit | Doppler",
      collections: [],
      crates: [crateRef("crate-4818"), crateRef("crate-4011"), crateRef("crate-4790")],
    });
    const result = resolve(other);
    expect(result.caseOrCollection).toBe("Operation Phoenix Weapon Case");
    expect(result.releaseYear).toBe(2014);
  });

  it("prefers a dated container over an undated one", () => {
    const raw = makeRawSkin({
      collections: [],
      crates: [crateRef("crate-undated"), crateRef("crate-4790")],
    });
    expect(resolve(raw).caseOrCollection).toBe("Operation Riptide Case");
  });

  it("falls back to a dated collection when no crate carries a date", () => {
    const raw = makeRawSkin({
      collections: [{ id: "collection-set-weapons-i", name: "The Arms Deal Collection", image: "" }],
      crates: [crateRef("crate-undated")],
    });
    const result = resolve(raw);
    expect(result.caseOrCollection).toBe("The Arms Deal Collection");
    expect(result.releaseYear).toBe(2013);
  });

  it("flags a multi-container skin as ambiguous when nothing carries a date", () => {
    const raw = makeRawSkin({
      collections: [],
      crates: [crateRef("crate-undated"), crateRef("crate-undated-2")],
    });
    const result = resolve(raw);
    expect(result.ambiguous).toBe(true);
    expect(result.releaseYear).toBeNull();
    // Still deterministic despite being unresolvable, so reseeds don't churn.
    expect(result.caseOrCollection).toBe(resolve(raw).caseOrCollection);
  });

  it("does not call a single undated container ambiguous — that is just missing data", () => {
    const raw = makeRawSkin({ collections: [], crates: [crateRef("crate-undated")] });
    expect(resolve(raw).ambiguous).toBe(false);
  });

  it("produces one canonical source even though the skin is in many containers", () => {
    const raw = makeRawSkin({
      collections: [],
      crates: [crateRef("crate-4790"), crateRef("crate-4818"), crateRef("crate-4011")],
    });
    const result = resolve(raw);
    expect(result.sourceContainerId).toBe("crate-4011");
    expect(result.containers).toHaveLength(3);
  });
});
