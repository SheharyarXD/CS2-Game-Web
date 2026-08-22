import sharp from "sharp";
import type { ColorKey } from "@/lib/game/types";

/**
 * Derives a deterministic ColorKey from a skin's actual rendered image.
 *
 * The upstream dataset has no "main color" field, so this is our own
 * normalization layer (per project requirement: never fabricate metadata —
 * derive it from something real). The same image byte-for-byte always
 * produces the same bucket:
 *
 *  1. Downsample to a small grid and read raw RGBA pixels.
 *  2. Drop near-transparent pixels (the source images sit on a transparent
 *     background) so the background never pollutes the average.
 *  3. Classify each opaque pixel into a coarse hue/neutral bucket.
 *  4. The bucket with the most pixels wins — unless no bucket clears a
 *     dominance threshold, in which case the skin is called "multicolor"
 *     (no single hue reads as *the* color of something like a fade/marble
 *     pattern with three or more roughly-equal hues).
 *
 * Thresholds are approximations tuned by hand against known skins (see
 * scripts/seed-skins.ts test run notes) — adjust the constants below if a
 * category of skin is consistently misclassified; nothing else needs to
 * change since classification is fully isolated in this module.
 */

const ALPHA_THRESHOLD = 40; // out of 255; pixels more transparent than this are ignored
const DOMINANCE_THRESHOLD = 0.4; // winning bucket must hold >= 40% of opaque pixels
const SAMPLE_SIZE = 48; // resize target (px) — enough signal, cheap to process

type Bucket = ColorKey;

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      break;
    case gn:
      h = ((bn - rn) / d + 2) * 60;
      break;
    default:
      h = ((rn - gn) / d + 4) * 60;
  }
  return { h, s, l };
}

function classifyPixel(h: number, s: number, l: number): Bucket {
  if (l > 0.94 && s < 0.12) return "white";
  if (l < 0.1) return "black";
  if (s < 0.12) return "gray";

  // Gold: warm, saturated, mid-lightness metallic tone (checked before the
  // broader yellow/orange bands since it's a narrower, more specific hit).
  if (h >= 38 && h <= 55 && s > 0.45 && l >= 0.3 && l <= 0.68) return "gold";
  // Brown: same warm hue range as orange/red, but dark and desaturated.
  if (h >= 5 && h <= 45 && l < 0.32 && s >= 0.15) return "brown";

  if (h < 14 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "yellow";
  if (h < 165) return "green";
  if (h < 200) return "blue"; // cyan folds into blue — no dedicated bucket
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  if (h < 345) return "pink";
  return "red";
}

export interface ColorExtractionResult {
  color: ColorKey;
  dominantShare: number;
}

export async function extractDominantColor(imageBuffer: Buffer): Promise<ColorExtractionResult> {
  const { data, info } = await sharp(imageBuffer)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 4 (RGBA) after ensureAlpha
  const counts = new Map<Bucket, number>();
  let opaquePixels = 0;

  for (let i = 0; i < data.length; i += channels) {
    const alpha = data[i + 3] ?? 255;
    if (alpha < ALPHA_THRESHOLD) continue;

    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const { h, s, l } = rgbToHsl(r, g, b);
    const bucket = classifyPixel(h, s, l);

    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    opaquePixels += 1;
  }

  if (opaquePixels === 0) {
    return { color: "gray", dominantShare: 0 };
  }

  let winner: Bucket = "gray";
  let winnerCount = 0;
  for (const [bucket, count] of counts) {
    if (count > winnerCount) {
      winner = bucket;
      winnerCount = count;
    }
  }

  const dominantShare = winnerCount / opaquePixels;
  if (dominantShare < DOMINANCE_THRESHOLD) {
    return { color: "multicolor", dominantShare };
  }
  return { color: winner, dominantShare };
}
