import { createHash } from "node:crypto";
import type { CaseType, RarityKey, WeaponCategory } from "@/lib/game/types";
import type { RawCollection, RawCrate, RawSkin } from "./rawSkinTypes";

const RARITY_MAP: Record<string, RarityKey> = {
  "Consumer Grade": "consumer",
  "Industrial Grade": "industrial",
  "Mil-Spec Grade": "milspec",
  Restricted: "restricted",
  Classified: "classified",
  Covert: "covert",
  Contraband: "contraband",
  Extraordinary: "extraordinary",
};

export function mapRarity(name: string): RarityKey | null {
  return RARITY_MAP[name] ?? null;
}

/**
 * In game, every knife and every pair of gloves is a "Rare Special Item"
 * — the gold tier — regardless of the finish applied to it.
 *
 * The upstream dataset instead labels knife finishes with the rarity of
 * the *pattern* (almost all Covert), which would render a Karambit red
 * rather than gold. The item category therefore overrides the pattern
 * rarity here. Gloves already arrive as Extraordinary, but are included
 * so the rule is explicit rather than incidental.
 */
export function applyRareSpecialItem(rarity: RarityKey, category: WeaponCategory): RarityKey {
  if (category === "knife" || category === "gloves") return "extraordinary";
  return rarity;
}

/** Deterministic [0, size) index derived from a string — stable across runs/machines. */
export function deterministicIndex(input: string, size: number): number {
  if (size <= 0) return 0;
  const digest = createHash("sha256").update(input).digest();
  return digest.readUInt32BE(0) % size;
}

const SOUVENIR_PACKAGE_PATTERN = /souvenir package/i;

/**
 * Parses the two date formats the upstream data uses.
 *
 * crates.json is inconsistent about separators — older entries read
 * "2013/12/17" and newer ones "2021-09-08" — and both are plain calendar
 * dates with no time or zone. They are anchored to UTC midnight so a
 * release never shifts a day depending on where the importer runs.
 *
 * Returns null for anything unparseable rather than guessing, so a missing
 * date stays visibly missing instead of silently becoming 1970.
 */
export function parseReleaseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** One container a skin can be found in, with the date it shipped. */
export interface ContainerRef {
  id: string;
  name: string;
  type: CaseType;
  /** ISO date string, or null when the source has no date for it. */
  releaseDate: string | null;
}

export interface OriginalRelease {
  caseOrCollection: string | null;
  caseType: CaseType;
  sourceContainerId: string | null;
  releaseDate: Date | null;
  releaseYear: number | null;
  /** Every non-souvenir container the skin appears in, earliest first. */
  containers: ContainerRef[];
  /**
   * True when the skin sits in several containers and we could not tell
   * which came first, because none of the candidates carried a date. The
   * caller reports these rather than letting an arbitrary pick pass as
   * fact.
   */
  ambiguous: boolean;
}

/**
 * Builds the date lookups used to order a skin's containers.
 *
 * A crate normally carries its own `first_sale_date`. Some do not — the
 * "Sealed ... Terminal" containers CS2 ships collections in are listed
 * with no date at all. But `collections.json` says which crates belong to
 * which collection, and collections do carry a `release_date`, so an
 * undated crate inherits the date of the collection that ships it.
 *
 * That is a cross-check between the two source files rather than a guess:
 * the terminal is the container for that collection, so the collection's
 * release is the date the skins inside it became available. A crate's own
 * date always wins when it has one, and anything still undated stays
 * undated.
 */
export function buildContainerDates(
  crates: RawCrate[],
  collections: RawCollection[],
): { crateDates: Map<string, Date>; collectionDates: Map<string, Date> } {
  const crateDates = new Map<string, Date>();
  const collectionDates = new Map<string, Date>();

  for (const crate of crates) {
    const date = parseReleaseDate(crate.first_sale_date);
    if (date) crateDates.set(crate.id, date);
  }

  for (const collection of collections) {
    const date = parseReleaseDate(collection.release_date);
    if (!date) continue;
    collectionDates.set(collection.id, date);

    for (const crate of collection.crates ?? []) {
      if (crateDates.has(crate.id)) continue; // the crate's own date wins
      const existing = crateDates.get(crate.id);
      if (!existing || date < existing) crateDates.set(crate.id, date);
    }
  }

  // A crate's own date must never be overwritten by an inherited one, so
  // re-apply them after the inheritance pass.
  for (const crate of crates) {
    const date = parseReleaseDate(crate.first_sale_date);
    if (date) crateDates.set(crate.id, date);
  }

  return { crateDates, collectionDates };
}

/**
 * Resolves the container a skin was ORIGINALLY released in, plus the year
 * that container shipped.
 *
 * This matters because a Rare Special Item can be dropped from several
 * cases over the years. Butterfly Knife | Lore is in both the Operation
 * Riptide Case (2021-09-08) and the Dreams & Nightmares Case (2021-11-17);
 * the game must compare against Riptide, since that is where it was
 * introduced. Taking the first entry in the array, the newest, or an
 * alphabetical pick would all be wrong — the dataset's ordering carries no
 * meaning. So every candidate is dated from crates.json / collections.json
 * and the earliest wins.
 *
 * Crates are preferred over collections when a skin has both: a case is
 * the specific container something drops from, and its date is the more
 * precise answer to "when did this skin appear".
 *
 * Souvenir packages are excluded first, per the original project scope —
 * they are a bonus drop source for a handful of majors, not a skin's real
 * home, and they carry no sale dates in the dataset anyway.
 *
 * Ties are broken by container id so the result is stable across reseeds
 * rather than depending on input ordering.
 */
export function pickOriginalRelease(
  raw: Pick<RawSkin, "crates" | "collections">,
  crateDates: Map<string, Date>,
  collectionDates: Map<string, Date>,
): OriginalRelease {
  const toRef = (
    id: string,
    name: string,
    type: CaseType,
    date: Date | undefined,
  ): ContainerRef & { date: Date | null } => ({
    id,
    name,
    type,
    releaseDate: date ? date.toISOString() : null,
    date: date ?? null,
  });

  // De-duplicate by id first: merging phase variants of one skin can list
  // the same container more than once.
  const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
  };

  const crateRefs = uniqueById(raw.crates.filter((c) => !SOUVENIR_PACKAGE_PATTERN.test(c.name))).map((c) =>
    toRef(c.id, c.name, "case", crateDates.get(c.id)),
  );

  const collectionRefs = uniqueById(raw.collections).map((c) =>
    toRef(c.id, c.name, "collection", collectionDates.get(c.id)),
  );

  // Crates first: they are the more specific container, and when a skin is
  // in both the crate is what a player would name. The exception is a
  // crate set with no dates at all while the collections do have them —
  // there, the collection is the only thing that can answer "when", so a
  // dated collection beats an undated crate.
  const anyDated = (refs: Array<{ date: Date | null }>) => refs.some((r) => r.date);
  const candidates =
    crateRefs.length > 0 && (anyDated(crateRefs) || !anyDated(collectionRefs))
      ? crateRefs
      : collectionRefs.length > 0
        ? collectionRefs
        : crateRefs;

  if (candidates.length === 0) {
    return {
      caseOrCollection: null,
      caseType: null,
      sourceContainerId: null,
      releaseDate: null,
      releaseYear: null,
      containers: [],
      ambiguous: false,
    };
  }

  const sorted = [...candidates].sort((a, b) => {
    // Undated candidates sink to the bottom so a dated one always wins.
    if (a.date && b.date && a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.id.localeCompare(b.id);
  });

  const original = sorted[0]!;
  const datedCount = candidates.filter((c) => c.date).length;

  return {
    caseOrCollection: original.name,
    caseType: original.type,
    sourceContainerId: original.id,
    releaseDate: original.date,
    releaseYear: original.date ? original.date.getUTCFullYear() : null,
    containers: sorted.map(({ id, name, type, releaseDate }) => ({ id, name, type, releaseDate })),
    // Only ambiguous when there was a real choice to make and nothing to
    // make it with. One undated container is missing data, not ambiguity.
    ambiguous: candidates.length > 1 && datedCount === 0,
  };
}

/** Strips the "★ " knife/glove marker Valve prefixes onto `name`, for a clean display name. */
export function cleanDisplayName(rawName: string): string {
  return rawName.replace(/^★\s*/, "").trim();
}
