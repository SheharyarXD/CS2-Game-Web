import { gameConfig } from "./config";

/**
 * Map reveal mechanics.
 *
 * Rather than shipping 11 hand-cropped images per map, we render the same
 * full-resolution image every time and control how much of it is visible
 * with a CSS transform: the image is scaled up (zoomed in) inside an
 * overflow-hidden viewport, centered on the map's focal point. As the
 * reveal percentage grows, the zoom scale shrinks back toward 1 (full
 * image, no zoom) — a deterministic function of the guess count, so the
 * same attempt always reveals the same amount for every player.
 *
 * The reveal curve is linear from `startingRevealPercent` up to exactly
 * 100% at `maxGuesses`, guaranteeing the final failed attempt always shows
 * the complete, unzoomed map with no jarring last-second jump.
 */

export function revealPercentForGuessCount(usedGuesses: number): number {
  const { startingRevealPercent, maxGuesses } = gameConfig.mapMode;
  if (usedGuesses <= 0) return startingRevealPercent;
  if (usedGuesses >= maxGuesses) return 100;

  const step = (100 - startingRevealPercent) / maxGuesses;
  const percent = startingRevealPercent + usedGuesses * step;
  return Math.min(100, Math.round(percent * 10) / 10);
}

/**
 * Converts a reveal percentage (treated as the fraction of the image's
 * *area* visible) into a CSS zoom scale factor. Visible area shrinks with
 * the square of the zoom, so scale = sqrt(100 / revealPercent).
 */
export function zoomScaleForRevealPercent(revealPercent: number): number {
  const clamped = Math.min(100, Math.max(1, revealPercent));
  if (clamped >= 100) return 1;
  return Math.sqrt(100 / clamped);
}

export function isMapGameOver(usedGuesses: number, won: boolean): boolean {
  return won || usedGuesses >= gameConfig.mapMode.maxGuesses;
}
