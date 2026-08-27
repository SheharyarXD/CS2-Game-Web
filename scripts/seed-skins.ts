/**
 * Normalizes the raw CS2 skin dataset into our schema and upserts the
 * curated, popular-skin subset into the database. Safe to run repeatedly:
 * everything is keyed by the upstream skin id and upserted.
 *
 * Usage:
 *   npm run data:fetch   # refresh data/raw/skins.json (optional — auto-runs if missing)
 *   npm run seed:skins
 */
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractDominantColor } from "./lib/extractDominantColor";
import {
  applyRareSpecialItem,
  cleanDisplayName,
  mapRarity,
  pickCanonicalWear,
  pickCaseOrCollection,
} from "./lib/normalizeSkin";
// Relative rather than the "@/" alias: this runs under tsx, which does not
// apply the tsconfig path mapping to runtime value imports.
import { mapWeaponCategory } from "../src/lib/game/weaponMatching";
import type { RawSkin } from "./lib/rawSkinTypes";
import { POPULAR_SKINS } from "./data/popularSkinsAllowlist";

const prisma = new PrismaClient();
const RAW_PATH = path.resolve(process.cwd(), "data", "raw", "skins.json");
const COLOR_CACHE_PATH = path.resolve(process.cwd(), "data", "cache", "colors.json");

type ColorCache = Record<string, { color: string; dominantShare: number }>;

async function loadRawSkins(): Promise<RawSkin[]> {
  if (!existsSync(RAW_PATH)) {
    console.log("data/raw/skins.json not found — fetching it first...");
    await import("./fetch-skin-data");
    // fetch-skin-data.ts runs its own main() and exits the process on
    // completion via its own script semantics when run standalone; when
    // imported like this it just executes top-level, so give it a beat.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const raw = await readFile(RAW_PATH, "utf-8");
  return JSON.parse(raw) as RawSkin[];
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

type MatchedRawSkin = RawSkin & {
  weapon: NonNullable<RawSkin["weapon"]>;
  pattern: NonNullable<RawSkin["pattern"]>;
  category: NonNullable<RawSkin["category"]>;
};

function matchesAllowlist(raw: RawSkin): raw is MatchedRawSkin {
  // A handful of entries are "vanilla" weapons with no special paint
  // (pattern: null) — they can never match a curated skin name, so skip
  // them rather than crash on the null.
  if (!raw.weapon || !raw.pattern || !raw.category) return false;
  const weaponName = raw.weapon.name.toLowerCase();
  const patternName = raw.pattern.name.toLowerCase();
  return POPULAR_SKINS.some(
    (entry) => entry.weapon.toLowerCase() === weaponName && entry.name.toLowerCase() === patternName,
  );
}

async function resolveColor(cache: ColorCache, skin: RawSkin): Promise<{ color: string; source: "image" | "fallback" }> {
  const cached = cache[skin.id];
  if (cached) return { color: cached.color, source: "image" };

  try {
    const res = await fetch(skin.image);
    if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const result = await extractDominantColor(buffer);
    cache[skin.id] = { color: result.color, dominantShare: result.dominantShare };
    return { color: result.color, source: "image" };
  } catch (err) {
    console.warn(`  ! color extraction failed for ${skin.name}: ${(err as Error).message} — falling back to gray`);
    return { color: "gray", source: "fallback" };
  }
}

async function main() {
  const rawSkins = await loadRawSkins();
  const matched = rawSkins.filter(matchesAllowlist);

  console.log(`Matched ${matched.length} / ${POPULAR_SKINS.length} allowlist entries against ${rawSkins.length} raw skins.`);

  const matchedKeys = new Set(matched.map((s) => `${s.weapon.name.toLowerCase()}|${s.pattern.name.toLowerCase()}`));
  const unmatched = POPULAR_SKINS.filter(
    (e) => !matchedKeys.has(`${e.weapon.toLowerCase()}|${e.name.toLowerCase()}`),
  );
  if (unmatched.length > 0) {
    console.warn(`Warning: ${unmatched.length} allowlist entries had no match in the dataset and were skipped:`);
    for (const entry of unmatched) console.warn(`  - ${entry.weapon} | ${entry.name}`);
  }

  const colorCache = await loadColorCache();
  let imported = 0;
  let skippedInvalid = 0;

  for (const [index, raw] of matched.entries()) {
    const sourceRarity = mapRarity(raw.rarity.name);
    const wear = pickCanonicalWear(raw.id, raw.wears);
    const weaponCategory = mapWeaponCategory(raw.category.name);
    const rarity = sourceRarity && weaponCategory ? applyRareSpecialItem(sourceRarity, weaponCategory) : null;
    if (!rarity || !wear || !weaponCategory) {
      console.warn(
        `  ! skipping ${raw.name}: unmapped rarity/wear/category (${raw.rarity.name} / wears=${raw.wears.length} / ${raw.category.name})`,
      );
      skippedInvalid += 1;
      continue;
    }

    const { caseOrCollection, caseType } = pickCaseOrCollection(raw);
    const { color, source } = await resolveColor(colorCache, raw);
    const isKnife = raw.category.name === "Knives";
    const isGlove = raw.category.name === "Gloves";
    const displayName = cleanDisplayName(raw.name);
    const searchText = `${raw.weapon.name} ${raw.pattern.name} ${displayName}`.toLowerCase();

    const data = {
      name: raw.pattern.name,
      weapon: raw.weapon.name,
      displayName,
      imageUrl: raw.image,
      rarity,
      caseOrCollection,
      caseType,
      wear,
      availableWears: JSON.stringify(raw.wears.map((w) => w.name)),
      color,
      colorSource: source,
      weaponCategory,
      searchText,
      isKnife,
      isGlove,
      hasStatTrak: raw.stattrak,
      active: true,
      popularity: POPULAR_SKINS.length - index,
      sourceId: raw.id,
    };

    await prisma.skin.upsert({
      where: { id: raw.id },
      update: data,
      create: { id: raw.id, ...data },
    });

    imported += 1;
    if (imported % 20 === 0) {
      await saveColorCache(colorCache); // checkpoint periodically — image fetches are the slow part
      console.log(`  ...${imported}/${matched.length} imported`);
    }
  }

  await saveColorCache(colorCache);
  console.log(`Done. Imported/updated ${imported} skins (${skippedInvalid} skipped as unmappable).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
