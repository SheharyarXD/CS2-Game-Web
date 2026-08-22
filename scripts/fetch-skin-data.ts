/**
 * Downloads the raw CS2 skin dataset and caches it locally so `seed-skins`
 * runs are fast and repeatable without hitting the network every time.
 *
 * Data source: ByMykel/CSGO-API (https://github.com/ByMykel/CSGO-API) — a
 * public, no-auth-required, community-maintained mirror of Valve's item
 * schema, published as static JSON. It's the grouped-by-skin endpoint
 * (skins.json), meaning each entry already represents one recognizable
 * skin with `stattrak`/`souvenir` as availability flags rather than
 * separate rows — exactly the granularity this game wants (see
 * requirement: don't treat every variant as an independent item).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_SOURCE_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";

async function main() {
  const url = process.env.SKIN_DATA_SOURCE_URL || DEFAULT_SOURCE_URL;
  console.log(`Fetching skin data from ${url} ...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch skin data: ${res.status} ${res.statusText}`);
  }
  const json = await res.text();

  const outDir = path.resolve(process.cwd(), "data", "raw");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "skins.json");
  await writeFile(outPath, json, "utf-8");

  const parsed = JSON.parse(json) as unknown[];
  console.log(`Saved ${parsed.length} raw skin entries to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
