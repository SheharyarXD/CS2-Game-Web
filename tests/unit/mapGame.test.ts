import { describe, expect, it } from "vitest";
import { isMapGameOver, revealPercentForGuessCount, zoomScaleForRevealPercent } from "@/lib/game/mapGame";
import { gameConfig } from "@/lib/game/config";

describe("revealPercentForGuessCount", () => {
  it("starts at the configured starting reveal percent before any guesses", () => {
    expect(revealPercentForGuessCount(0)).toBe(gameConfig.mapMode.startingRevealPercent);
  });

  it("reaches exactly 100% at the final guess — no matter how the curve rounds along the way", () => {
    expect(revealPercentForGuessCount(gameConfig.mapMode.maxGuesses)).toBe(100);
  });

  it("clamps to 100% even if called with more than the max guesses", () => {
    expect(revealPercentForGuessCount(gameConfig.mapMode.maxGuesses + 5)).toBe(100);
  });

  it("is monotonically non-decreasing as guesses increase", () => {
    let previous = -1;
    for (let i = 0; i <= gameConfig.mapMode.maxGuesses; i++) {
      const percent = revealPercentForGuessCount(i);
      expect(percent).toBeGreaterThanOrEqual(previous);
      previous = percent;
    }
  });
});

describe("zoomScaleForRevealPercent", () => {
  it("returns a scale of 1 (no zoom) at 100% reveal", () => {
    expect(zoomScaleForRevealPercent(100)).toBe(1);
  });

  it("returns a larger scale for a smaller reveal percentage", () => {
    const smallReveal = zoomScaleForRevealPercent(5);
    const largeReveal = zoomScaleForRevealPercent(50);
    expect(smallReveal).toBeGreaterThan(largeReveal);
    expect(largeReveal).toBeGreaterThan(1);
  });
});

describe("isMapGameOver", () => {
  it("is over immediately on a win, regardless of guess count", () => {
    expect(isMapGameOver(1, true)).toBe(true);
  });

  it("is not over below the max guesses without a win", () => {
    expect(isMapGameOver(gameConfig.mapMode.maxGuesses - 1, false)).toBe(false);
  });

  it("is over once the max guesses are reached without a win", () => {
    expect(isMapGameOver(gameConfig.mapMode.maxGuesses, false)).toBe(true);
  });
});
