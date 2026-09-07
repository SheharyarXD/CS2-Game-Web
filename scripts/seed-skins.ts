/**
 * Normalizes the raw CS2 skin dataset into our schema and upserts it.
 * Safe to run repeatedly: everything is keyed by the upstream skin id and
 * upserted, so a re-run refreshes values without duplicating rows or
 * disturbing in-flight game sessions.
 *
 * Coverage: every skin in the upstream dataset that can be normalized —
 * all case skins, all collection skins (active, armory, operation,
 * inactive and discontinued alike), and the Rare Special Items from every
 * case. Entries with no paint pattern (vanilla weapons) and equipment like
 * the Zeus are skipped, since neither is a guessable skin.
 *
 * A skin that appears in several containers is still ONE row. Its
 * case/collection and release year are taken from the container it was
 * originally released in — see lib/normalizeSkin.ts#pickOriginalRelease.
 *
 * Usage:
 *   npm run data:fetch   # refresh data/raw/*.json (auto-runs if missing)
 *   npm run seed:skins
 */
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractDominantColor } from "./lib/extractDominantColor";
import {
  applyRareSpecialItem,
  buildContainerDates,
  cleanDisplayName,
  mapRarity,
  pickOriginalRelease,
} from "./lib/normalizeSkin";
// Relative rather than the "@/" alias: this runs under tsx, which does not
// apply the tsconfig path mapping to runtime value imports.
import { mapWeaponCategory } from "../src/lib/game/weaponMatching";
import type { RawCollection, RawCrate, RawSkin } from "./lib/rawSkinTypes";
import { POPULAR_SKINS } from "./data/popularSkinsAllowlist";

const prisma = new PrismaClient();
const RAW_DIR = path.resolve(process.cwd(), "data", "raw");
const COLOR_CACHE_PATH = path.resolve(process.cwd(), "data", "cache", "colors.json");

/** How many skin images to fetch at once when deriving colours. */
const COLOR_CONCURRENCY = 12;

type ColorCache = Record<string, { color: string; dominantShare: number }>;

async function loadRaw<T>(file: string): Promise<T[]> {
  const filePath = path.join(RAW_DIR, file);
  if (!existsSync(filePath)) {
    console.log(`data/raw/${file} not found — fetching the datasets first...`);
    await import("./fetch-skin-data");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return JSON.parse(await readFile(filePath, "utf-8")) as T[];
}

async function loadColorCache(): Promise<ColorCache> {
  if (!existsSync(COLOR_CACHE_PATH)) return {};
  try {
    return JSON.parse(await readFile(COLOR_CACHE_PATH, "utf-8")) as ColorCache;
  } catch {
    return {};
  }
}

async function saveColorCache(cache: ColorCache) {
  await mkdir(path.dirname(COLOR_CACHE_PATH), { recursive: true });
  await writeFile(COLOR_CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

type UsableRawSkin = RawSkin & {
  weapon: NonNullable<RawSkin["weapon"]>;
  pattern: NonNullable<RawSkin["pattern"]>;
  category: NonNullable<RawSkin["category"]>;
};

/**
 * A guessable skin needs a weapon, a paint pattern and a category. Vanilla
 * weapons carry no pattern and equipment (Zeus) has no weapon category we
 * map, so both drop out here rather than becoming unguessable rows.
 */
function isUsable(raw: RawSkin): raw is UsableRawSkin {
  return Boolean(raw.weapon && raw.pattern && raw.category);
}

/**
 * Collapses phase variants into one guessable skin.
 *
 * The upstream data lists every Doppler phase as its own entry — Bayonet |
 * Doppler appears seven times (Phases 1-4, Ruby, Sapphire, Black Pearl),
 * all with the same display name and the same source cases. A phase is a
 * pattern-index variant of one finish, not a separate skin, so importing
 * them individually would put seven identical-looking rows in the search
 * box and make whichever one the daily picked impossible to guess
 * deliberately.
 *
 * Entries are grouped by display name (which is "weapon | pattern", so two
 * genuinely different skins can never collide). The lowest id becomes the
 * canonical row, which keeps the choice stable across reseeds, and the
 * group's containers are merged so the original-release rule still sees
 * every case the skin drops from. StatTrak availability is OR-ed, since it
 * holds if it holds for any phase.
 */
function collapsePhaseVariants(skins: UsableRawSkin[]): UsableRawSkin[] {
  const groups = new Map<string, UsableRawSkin[]>();
  for (const skin of skins) {
    const key = cleanDisplayName(skin.name);
    const group = groups.get(key);
    if (group) group.push(skin);
    else groups.set(key, [skin]);
  }

  const merged: UsableRawSkin[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]!);
      continue;
    }
    const ordered = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const canonical = ordered[0]!;
    merged.push({
      ...canonical,
      crates: dedupeById(ordered.flatMap((s) => s.crates)),
      collections: dedupeById(ordered.flatMap((s) => s.collections)),
      stattrak: ordered.some((s) => s.stattrak),
      souvenir: ordered.some((s) => s.souvenir),
    });
  }
  return merged;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

/**
 * Recognizable skins rank first in the search box.
 *
 * The curated list used to decide which skins existed at all. Now that the
 * whole catalogue is imported it grades them instead: an allowlisted skin
 * gets a large popularity boost so autocomplete still surfaces the AK-47 |
 * Redline ahead of an obscure Mil-Spec from the same weapon. It changes
 * ordering only, never eligibility.
 */
function buildPopularityIndex(): Map<string, number> {
  const index = new Map<string, number>();
  POPULAR_SKINS.forEach((entry, i) => {
    index.set(`${entry.weapon.toLowerCase()}|${entry.name.toLowerCase()}`, POPULAR_SKINS.length - i);
  });
  return index;
}

/** Resolves colours for many skins at once, respecting the on-disk cache. */
async function resolveColors(
  cache: ColorCache,
  skins: UsableRawSkin[],
): Promise<Map<string, { color: string; source: "image" | "fallback" }>> {
  const out = new Map<string, { color: string; source: "image" | "fallback" }>();
  const pending: UsableRawSkin[] = [];

  for (const skin of skins) {
    const cached = cache[skin.id];
    if (cached) out.set(skin.id, { color: cached.color, source: "image" });
    else pending.push(skin);
  }

  if (pending.length === 0) return out;
  console.log(`Deriving colours for ${pending.length} skins (${out.size} already cached)...`);

  let cursor = 0;
  let done = 0;
  const worker = async () => {
    for (;;) {
      const i = cursor++;
      if (i >= pending.length) return;
      const skin = pending[i]!;
      try {
        const res = await fetch(skin.image);
        if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const result = await extractDominantColor(buffer);
        cache[skin.id] = { color: result.color, dominantShare: result.dominantShare };
        out.set(skin.id, { color: result.color, source: "image" });
      } catch {
        // Recorded as a fallback rather than silently passing as derived
        // data — colorSource keeps the provenance visible in the database.
        out.set(skin.id, { color: "gray", source: "fallback" });
      }
      done += 1;
      if (done % 100 === 0) {
        await saveColorCache(cache);
        console.log(`  ...colours ${done}/${pending.length}`);
      }
    }
  };

  await Promise.all(Array.from({ length: COLOR_CONCURRENCY }, worker));
  await saveColorCache(cache);
  return out;
}

async function main() {
  const [rawSkins, crates, collections] = await Promise.all([
    loadRaw<RawSkin>("skins.json"),
    loadRaw<RawCrate>("crates.json"),
    loadRaw<RawCollection>("collections.json"),
  ]);

  const { crateDates, collectionDates } = buildContainerDates(crates, collections);
  const popularity = buildPopularityIndex();

  const withPhases = rawSkins.filter(isUsable);
  const usable = collapsePhaseVariants(withPhases);
  console.log(
    `${rawSkins.length} raw entries, ${withPhases.length} with a weapon/pattern/category, ` +
      `${usable.length} after collapsing ${withPhases.length - usable.length} phase variants, ` +
      `against ${crates.length} crates and ${collections.length} collections.`,
  );

  const colorCache = await loadColorCache();
  const colors = await resolveColors(colorCache, usable);

  let imported = 0;
  let skippedInvalid = 0;
  let ambiguousOriginal = 0;
  let missingYear = 0;

  for (const raw of usable) {
    const sourceRarity = mapRarity(raw.rarity.name);
    const weaponCategory = mapWeaponCategory(raw.category.name);
    const rarity = sourceRarity && weaponCategory ? applyRareSpecialItem(sourceRarity, weaponCategory) : null;
    if (!rarity || !weaponCategory) {
      skippedInvalid += 1;
      continue;
    }

    const release = pickOriginalRelease(raw, crateDates, collectionDates);
    if (release.ambiguous) ambiguousOriginal += 1;
    if (release.releaseYear === null) missingYear += 1;

    const color = colors.get(raw.id) ?? { color: "gray", source: "fallback" as const };
    const isKnife = raw.category.name === "Knives";
    const isGlove = raw.category.name === "Gloves";
    const displayName = cleanDisplayName(raw.name);
    const searchText = `${raw.weapon.name} ${raw.pattern.name} ${displayName}`.toLowerCase();
    const popKey = `${raw.weapon.name.toLowerCase()}|${raw.pattern.name.toLowerCase()}`;

    const data = {
      name: raw.pattern.name,
      weapon: raw.weapon.name,
      displayName,
      imageUrl: raw.image,
      rarity,
      caseOrCollection: release.caseOrCollection,
      caseType: release.caseType,
      sourceContainerId: release.sourceContainerId,
      releaseDate: release.releaseDate,
      releaseYear: release.releaseYear,
      containers: JSON.stringify(release.containers),
      color: color.color,
      colorSource: color.source,
      weaponCategory,
      searchText,
      isKnife,
      isGlove,
      hasStatTrak: raw.stattrak,
      active: true,
      popularity: popularity.get(popKey) ?? 0,
      sourceId: raw.id,
    };

    await prisma.skin.upsert({
      where: { id: raw.id },
      update: data,
      create: { id: raw.id, ...data },
    });

    imported += 1;
    if (imported % 200 === 0) console.log(`  ...${imported}/${usable.length} imported`);
  }

  const retired = await pruneStale(new Set(usable.map((s) => s.id)));

  console.log(
    `Done. Imported/updated ${imported} skins ` +
      `(${skippedInvalid} skipped as unmappable, ${missingYear} without a release year, ` +
      `${ambiguousOriginal} with an undeterminable original container, ${retired} retired).`,
  );
  console.log("Run `npm run data:report` for the full data-quality breakdown.");
}

/**
 * Removes rows this import no longer produces.
 *
 * Upserts alone would leave orphans behind whenever the normalization
 * rules change — collapsing Doppler phases, for instance, drops 150-odd
 * ids that used to be their own rows. Left in place they would still show
 * up in search and could still be picked as a daily target.
 *
 * A skin that has never been guessed is deleted outright. One that appears
 * in somebody's game history is only deactivated, because deleting it
 * would break the foreign keys that history hangs off; `active: false`
 * takes it out of search and out of the daily pool while leaving past
 * games readable.
 */
async function pruneStale(keepIds: Set<string>): Promise<number> {
  const stale = await prisma.skin.findMany({
    where: { id: { notIn: [...keepIds] } },
    select: { id: true },
  });
  if (stale.length === 0) return 0;

  const staleIds = stale.map((s) => s.id);
  const referenced = new Set<string>();
  for (const g of await prisma.gameGuess.findMany({
    where: { guessedSkinId: { in: staleIds } },
    select: { guessedSkinId: true },
  })) {
    if (g.guessedSkinId) referenced.add(g.guessedSkinId);
  }
  for (const s of await prisma.gameSession.findMany({
    where: { targetSkinId: { in: staleIds } },
    select: { targetSkinId: true },
  })) {
    if (s.targetSkinId) referenced.add(s.targetSkinId);
  }
  for (const d of await prisma.dailySkinGame.findMany({
    where: { skinId: { in: staleIds } },
    select: { skinId: true },
  })) {
    referenced.add(d.skinId);
  }

  const deletable = staleIds.filter((id) => !referenced.has(id));
  if (deletable.length > 0) {
    await prisma.skin.deleteMany({ where: { id: { in: deletable } } });
  }
  if (referenced.size > 0) {
    await prisma.skin.updateMany({ where: { id: { in: [...referenced] } }, data: { active: false } });
  }
  console.log(
    `Retired ${stale.length} rows this import no longer produces ` +
      `(${deletable.length} deleted, ${referenced.size} deactivated because they appear in game history).`,
  );
  return stale.length;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
