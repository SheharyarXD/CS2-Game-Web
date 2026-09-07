import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PrismaClient, type Skin } from "@prisma/client";
import { compareSkin } from "@/lib/game/skinComparison";
import { toNormalizedSkin } from "@/lib/server/normalize";

/**
 * Integrity checks against the actually-seeded dataset.
 *
 * These are deliberately about the data rather than the game loop: an
 * expanded import is only useful if every row is guessable, unique, and
 * carries the fields the four comparison categories read.
 */
const prisma = new PrismaClient();
let skins: Skin[] = [];

interface ContainerRef {
  id: string;
  name: string;
  type: string | null;
  releaseDate: string | null;
}

beforeAll(async () => {
  skins = await prisma.skin.findMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("dataset import", () => {
  it("imported the expanded catalogue, not just the old curated subset", () => {
    // The curated allowlist was ~225 entries. Anything near that number
    // means the allowlist is still acting as a filter.
    expect(skins.length).toBeGreaterThan(1500);
  });

  it("covers every weapon family", () => {
    const families = new Set(skins.map((s) => s.weaponCategory));
    for (const family of ["rifle", "pistol", "smg", "heavy", "knife", "gloves"]) {
      expect(families).toContain(family);
    }
  });

  it("covers the full rarity ladder including Rare Special Items", () => {
    const rarities = new Set(skins.map((s) => s.rarity));
    for (const rarity of ["consumer", "industrial", "milspec", "restricted", "classified", "covert"]) {
      expect(rarities).toContain(rarity);
    }
    expect(skins.filter((s) => s.rarity === "extraordinary").length).toBeGreaterThan(100);
  });

  it("includes both cases and collections as sources", () => {
    expect(skins.some((s) => s.caseType === "case")).toBe(true);
    expect(skins.some((s) => s.caseType === "collection")).toBe(true);
  });

  it("spans the whole history of the game", () => {
    const years = skins.map((s) => s.releaseYear).filter((y): y is number => y !== null);
    expect(Math.min(...years)).toBeLessThanOrEqual(2013);
    expect(Math.max(...years)).toBeGreaterThanOrEqual(2023);
  });
});

describe("no duplicate skin identities", () => {
  it("has no duplicate ids", () => {
    expect(new Set(skins.map((s) => s.id)).size).toBe(skins.length);
  });

  it("has no duplicate display names", () => {
    // Two rows a player cannot tell apart in the search box would make one
    // of them an unfair target.
    const seen = new Map<string, number>();
    for (const s of skins) seen.set(s.displayName, (seen.get(s.displayName) ?? 0) + 1);
    const dupes = [...seen.entries()].filter(([, n]) => n > 1);
    expect(dupes).toEqual([]);
  });

  it("does not split a multi-container skin into one row per container", () => {
    const multi = skins.filter((s) => (JSON.parse(s.containers) as ContainerRef[]).length > 1);
    expect(multi.length).toBeGreaterThan(0);
    for (const s of multi.slice(0, 50)) {
      expect(skins.filter((o) => o.displayName === s.displayName)).toHaveLength(1);
    }
  });
});

describe("weapon normalization", () => {
  it("gives every skin a non-empty exact weapon name", () => {
    expect(skins.filter((s) => !s.weapon || !s.weapon.trim())).toEqual([]);
  });

  it("keeps the weapon variants the client called out as distinct", () => {
    const names = new Set(skins.map((s) => s.weapon));
    for (const pair of [
      ["M4A1-S", "M4A4"],
      ["USP-S", "P2000"],
      ["AK-47", "Galil AR"],
    ]) {
      const [a, b] = pair as [string, string];
      expect(names).toContain(a);
      expect(names).toContain(b);
      expect(a).not.toBe(b);
    }
  });

  it("stores the weapon separately from the family", () => {
    // The column shows "AK-47", not "Rifle" — the family lives alongside it.
    const ak = skins.find((s) => s.weapon === "AK-47");
    expect(ak).toBeDefined();
    expect(ak!.weaponCategory).toBe("rifle");
  });
});

describe("release year normalization", () => {
  it("resolves a year for the overwhelming majority of skins", () => {
    const withYear = skins.filter((s) => s.releaseYear !== null);
    expect(withYear.length / skins.length).toBeGreaterThan(0.95);
  });

  it("never invents a year — the year always agrees with the stored release date", () => {
    for (const s of skins) {
      if (s.releaseYear === null) {
        expect(s.releaseDate).toBeNull();
      } else {
        expect(s.releaseDate).not.toBeNull();
        expect(s.releaseDate!.getUTCFullYear()).toBe(s.releaseYear);
      }
    }
  });

  it("only stores plausible CS release years", () => {
    // CS:GO shipped in 2012; nothing predates it and nothing is from the future.
    const nextYear = new Date().getUTCFullYear() + 1;
    for (const s of skins) {
      if (s.releaseYear === null) continue;
      expect(s.releaseYear).toBeGreaterThanOrEqual(2012);
      expect(s.releaseYear).toBeLessThanOrEqual(nextYear);
    }
  });

  it("does not use the import timestamp as the release year", () => {
    // A bug that read createdAt would stamp every row with this year.
    const thisYear = new Date().getUTCFullYear();
    const stamped = skins.filter((s) => s.releaseYear === thisYear);
    expect(stamped.length).toBeLessThan(skins.length / 2);
  });
});

describe("original release container", () => {
  it("takes the earliest container, not the first or last listed", () => {
    const multi = skins.filter((s) => (JSON.parse(s.containers) as ContainerRef[]).length > 1);
    expect(multi.length).toBeGreaterThan(0);

    for (const skin of multi) {
      const containers = JSON.parse(skin.containers) as ContainerRef[];
      const dated = containers.filter((c) => c.releaseDate);
      if (dated.length === 0) continue;
      const earliest = dated.reduce((a, b) => (a.releaseDate! <= b.releaseDate! ? a : b));
      expect(skin.sourceContainerId).toBe(earliest.id);
      expect(skin.caseOrCollection).toBe(earliest.name);
      expect(skin.releaseYear).toBe(new Date(earliest.releaseDate!).getUTCFullYear());
    }
  });

  it("resolves the client's Butterfly Knife | Lore example to Operation Riptide", () => {
    const lore = skins.find((s) => s.displayName === "Butterfly Knife | Lore");
    expect(lore).toBeDefined();
    const containers = JSON.parse(lore!.containers) as ContainerRef[];
    // It really is in both cases, so this is a genuine multi-source case.
    expect(containers.map((c) => c.name)).toContain("Dreams & Nightmares Case");
    expect(containers.map((c) => c.name)).toContain("Operation Riptide Case");
    // Riptide (Sept 2021) came first, so that is what the game compares on.
    expect(lore!.caseOrCollection).toBe("Operation Riptide Case");
    expect(lore!.releaseYear).toBe(2021);
  });

  it("applies the same rule to every Rare Special Item in several cases", () => {
    const rareMulti = skins.filter(
      (s) => s.rarity === "extraordinary" && (JSON.parse(s.containers) as ContainerRef[]).length > 1,
    );
    // This is the bulk of the knives and gloves, not a special case.
    expect(rareMulti.length).toBeGreaterThan(100);

    for (const skin of rareMulti) {
      const containers = JSON.parse(skin.containers) as ContainerRef[];
      const dated = containers.filter((c) => c.releaseDate);
      if (dated.length === 0) continue;
      const earliestDate = dated.reduce((a, b) => (a.releaseDate! <= b.releaseDate! ? a : b)).releaseDate!;
      // No later container was ever chosen over an earlier one.
      for (const c of dated) expect(c.releaseDate! >= earliestDate).toBe(true);
      expect(skin.releaseYear).toBe(new Date(earliestDate).getUTCFullYear());
    }
  });

  it("excludes souvenir packages from the containers it considers", () => {
    for (const skin of skins) {
      const containers = JSON.parse(skin.containers) as ContainerRef[];
      for (const c of containers) expect(c.name).not.toMatch(/souvenir package/i);
    }
  });
});

describe("every seeded skin is playable", () => {
  it("has the fields all four comparison categories read", () => {
    for (const s of skins) {
      expect(s.imageUrl).toBeTruthy();
      expect(s.weapon).toBeTruthy();
      expect(s.rarity).toBeTruthy();
      expect(s.weaponCategory).toBeTruthy();
      expect(s.searchText).toBeTruthy();
    }
  });

  it("scores all-correct against itself, so no target is unwinnable", () => {
    // Guessing the answer must always light up every column, including for
    // rows with a null collection or a null year.
    const sample = [
      ...skins.slice(0, 200),
      ...skins.filter((s) => s.caseOrCollection === null),
      ...skins.filter((s) => s.releaseYear === null),
    ];
    for (const s of sample) {
      const normalized = toNormalizedSkin(s);
      expect(compareSkin(normalized, normalized)).toEqual({
        weapon: "correct",
        collection: "correct",
        rarity: "correct",
        year: { state: "correct", direction: null },
      });
    }
  });
});
