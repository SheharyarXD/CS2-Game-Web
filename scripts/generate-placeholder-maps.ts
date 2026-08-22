/**
 * Generates original, abstract tactical-map artwork for every map in
 * data/maps.ts and writes it to public/maps/<id>.svg.
 *
 * IMPORTANT — why this exists: Valve's actual top-down radar/overview
 * images for CS2 maps are copyrighted game assets with no equivalent of
 * the public, hotlink-friendly Steam Community CDN that skin images use.
 * Rather than scraping them from a third party of uncertain licensing,
 * this script procedurally generates original layouts (seeded per map id,
 * so each map looks distinct but regenerates identically). It exists so
 * the Map Guess game is fully playable out of the box.
 *
 * To use real map imagery instead (recommended for a production
 * deployment): drop a top-down image at public/maps/<id>.jpg|png|webp,
 * point `imageUrl` at it in scripts/seed-maps.ts (or extend it to prefer a
 * real file over the generated .svg when one exists), and re-run
 * `npm run seed:maps`. No other code changes are required — the reveal
 * mechanic (src/lib/game/mapGame.ts) only cares about a URL + dimensions.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAP_POOL } from "../data/maps";

const SIZE = 1024;

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}

const BG = "#232a1f";
const GRID = "#2f3826";
const ROOM_FILLS = ["#3a4530", "#41502f", "#4a5a34", "#374229"];
const SITE_A = "#c46a2c";
const SITE_B = "#2f6fae";
const PATH_COLOR = "#5c6b47";

function generateMapSvg(seed: number): string {
  const rand = mulberry32(seed);
  const rooms: string[] = [];
  const roomCount = 9 + Math.floor(rand() * 5);

  const centers: Array<{ x: number; y: number; w: number; h: number }> = [];

  for (let i = 0; i < roomCount; i++) {
    const w = 90 + rand() * 160;
    const h = 90 + rand() * 160;
    const x = 60 + rand() * (SIZE - 120 - w);
    const y = 60 + rand() * (SIZE - 120 - h);
    centers.push({ x, y, w, h });
    const fill = ROOM_FILLS[Math.floor(rand() * ROOM_FILLS.length)];
    const rotation = (rand() - 0.5) * 6;
    rooms.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(
        1,
      )}" fill="${fill}" stroke="#1a1f15" stroke-width="3" rx="4" transform="rotate(${rotation.toFixed(
        1,
      )} ${(x + w / 2).toFixed(1)} ${(y + h / 2).toFixed(1)})" />`,
    );
  }

  // Connect rooms with simple corridor lines to suggest circulation paths.
  const corridors: string[] = [];
  for (let i = 1; i < centers.length; i++) {
    const a = centers[i - 1]!;
    const b = centers[i]!;
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    corridors.push(
      `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(
        1,
      )}" stroke="${PATH_COLOR}" stroke-width="22" stroke-linecap="round" opacity="0.55" />`,
    );
  }

  // Two accent "bombsite" zones for visual variety.
  const siteA = centers[Math.floor(rand() * centers.length)]!;
  const siteB = centers[Math.floor(rand() * centers.length)]!;
  const sites = [
    `<circle cx="${(siteA.x + siteA.w / 2).toFixed(1)}" cy="${(siteA.y + siteA.h / 2).toFixed(
      1,
    )}" r="46" fill="none" stroke="${SITE_A}" stroke-width="6" opacity="0.85" />`,
    `<circle cx="${(siteB.x + siteB.w / 2).toFixed(1)}" cy="${(siteB.y + siteB.h / 2).toFixed(
      1,
    )}" r="46" fill="none" stroke="${SITE_B}" stroke-width="6" opacity="0.85" />`,
  ];

  const gridLines: string[] = [];
  for (let g = 0; g <= SIZE; g += 64) {
    gridLines.push(`<line x1="${g}" y1="0" x2="${g}" y2="${SIZE}" stroke="${GRID}" stroke-width="1" />`);
    gridLines.push(`<line x1="0" y1="${g}" x2="${SIZE}" y2="${g}" stroke="${GRID}" stroke-width="1" />`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}" />
  <g>${gridLines.join("")}</g>
  <g>${corridors.join("")}</g>
  <g>${rooms.join("")}</g>
  <g>${sites.join("")}</g>
</svg>`;
}

async function main() {
  const outDir = path.resolve(process.cwd(), "public", "maps");
  await mkdir(outDir, { recursive: true });

  for (const map of MAP_POOL) {
    const svg = generateMapSvg(hashSeed(map.id));
    const outPath = path.join(outDir, `${map.id}.svg`);
    await writeFile(outPath, svg, "utf-8");
    console.log(`generated ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
