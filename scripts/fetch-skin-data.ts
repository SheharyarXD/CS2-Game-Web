/**
 * Downloads the raw CS2 datasets and caches them locally so `seed-skins`
 * runs are fast and repeatable without hitting the network every time.
 *
 * Data source: ByMykel/CSGO-API (https://github.com/ByMykel/CSGO-API) — a
 * public, no-auth-required, community-maintained mirror of Valve's item
 * schema, published as static JSON. Three files are pulled:
 *
 *   skins.json        the grouped-by-skin endpoint, where each entry is one
 *                     recognizable skin with `stattrak`/`souvenir` as
 *                     availability flags rather than separate rows — exactly
 *                     the granularity this game wants (see requirement:
 *                     don't treat every variant as an independent item).
 *   crates.json       every container, each carrying `first_sale_date`.
 *   collections.json  every collection, each carrying `release_date`.
 *
 * The two container files are what make the Year comparison and the
 * original-release rule possible: skins.json lists which crates a skin
 * drops from but carries no dates of its own, so the release timeline has
 * to be joined in from here. This is structured JSON straight from the
 * source, not scraped markup.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en";

interface Source {
  /** File written under data/raw/. */
  file: string;
  url: string;
  /** Environment variable that overrides the URL, if any. */
  envVar?: string;
}

const SOURCES: Source[] = [
  { file: "skins.json", url: `${BASE}/skins.json`, envVar: "SKIN_DATA_SOURCE_URL" },
  { file: "crates.json", url: `${BASE}/crates.json`, envVar: "CRATE_DATA_SOURCE_URL" },
  { file: "collections.json", url: `${BASE}/collections.json`, envVar: "COLLECTION_DATA_SOURCE_URL" },
];

async function main() {
  const outDir = path.resolve(process.cwd(), "data", "raw");
  await mkdir(outDir, { recursive: true });

  for (const source of SOURCES) {
    const url = (source.envVar && process.env[source.envVar]) || source.url;
    console.log(`Fetching ${source.file} from ${url} ...`);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${source.file}: ${res.status} ${res.statusText}`);
    }
    const json = await res.text();

    const outPath = path.join(outDir, source.file);
    await writeFile(outPath, json, "utf-8");

    const parsed = JSON.parse(json) as unknown[];
    console.log(`  saved ${parsed.length} entries to ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
