import { createHash } from "node:crypto";
import type { CaseType, RarityKey, WearKey } from "@/lib/game/types";
import type { RawSkin } from "./rawSkinTypes";

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

const WEAR_MAP: Record<string, WearKey> = {
  "Factory New": "factory_new",
  "Minimal Wear": "minimal_wear",
  "Field-Tested": "field_tested",
  "Well-Worn": "well_worn",
  "Battle-Scarred": "battle_scarred",
};

export function mapRarity(name: string): RarityKey | null {
  return RARITY_MAP[name] ?? null;
}

export function mapWear(name: string): WearKey | null {
  return WEAR_MAP[name] ?? null;
}

/** Deterministic [0, size) index derived from a string — stable across runs/machines. */
export function deterministicIndex(input: string, size: number): number {
  if (size <= 0) return 0;
  const digest = createHash("sha256").update(input).digest();
  return digest.readUInt32BE(0) % size;
}

/**
 * Picks the skin's canonical wear for comparison purposes.
 *
 * A skin entry can legitimately drop across a range of wears (e.g. Factory
 * New through Field-Tested, depending on its float range) — but the game
 * compares a single wear attribute per skin, the way Wordle-style games
 * compare a single value per category. Rather than always picking "best"
 * (which would make almost every skin "Factory New" and collapse the
 * attribute's usefulness), each skin deterministically gets one of its
 * own achievable wears, chosen by hashing its id. This is stable across
 * reseeds (same id always yields the same wear) and documented here so the
 * strategy can be swapped for e.g. "always best" without touching anything
 * else.
 */
export function pickCanonicalWear(skinId: string, wears: RawSkin["wears"]): WearKey | null {
  const mapped = wears.map((w) => mapWear(w.name)).filter((w): w is WearKey => w !== null);
  if (mapped.length === 0) return null;
  const index = deterministicIndex(skinId, mapped.length);
  return mapped[index]!;
}

const SOUVENIR_PACKAGE_PATTERN = /souvenir package/i;

/**
 * Resolves the case/collection to display and compare against.
 *
 * Per the "exclude souvenir versions" requirement: tournament Souvenir
 * Package crates are filtered out before picking a representative case —
 * they're a bonus drop source for a handful of majors, not the skin's
 * actual home case/collection, and surfacing one would be misleading (and
 * would make the same skin's case attribute inconsistently point at
 * whichever tournament happened to be listed first).
 */
export function pickCaseOrCollection(raw: RawSkin): { caseOrCollection: string | null; caseType: CaseType } {
  const nonSouvenirCrates = raw.crates.filter((c) => !SOUVENIR_PACKAGE_PATTERN.test(c.name));
  if (nonSouvenirCrates.length > 0) {
    return { caseOrCollection: nonSouvenirCrates[0]!.name, caseType: "case" };
  }
  if (raw.collections.length > 0) {
    return { caseOrCollection: raw.collections[0]!.name, caseType: "collection" };
  }
  return { caseOrCollection: null, caseType: null };
}

/** Strips the "★ " knife/glove marker Valve prefixes onto `name`, for a clean display name. */
export function cleanDisplayName(rawName: string): string {
  return rawName.replace(/^★\s*/, "").trim();
}
