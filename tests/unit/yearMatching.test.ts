import { describe, expect, it } from "vitest";
import { compareYear } from "@/lib/game/yearMatching";

describe("compareYear", () => {
  it("is green with no arrow when the years match", () => {
    expect(compareYear(2019, 2019)).toEqual({ state: "correct", direction: null });
  });

  it("points up when the guess is NEWER than the target", () => {
    // The arrow describes the guess, not the direction to move: a 2021 skin
    // guessed against a 2015 target reads "up".
    expect(compareYear(2021, 2015)).toEqual({ state: "incorrect", direction: "up" });
  });

  it("points down when the guess is OLDER than the target", () => {
    expect(compareYear(2015, 2021)).toEqual({ state: "incorrect", direction: "down" });
  });

  it("is not reversed — the two directions are genuinely opposite", () => {
    const newer = compareYear(2024, 2013);
    const older = compareYear(2013, 2024);
    expect(newer.direction).toBe("up");
    expect(older.direction).toBe("down");
    expect(newer.direction).not.toBe(older.direction);
  });

  it("points the right way for a one-year gap in either direction", () => {
    expect(compareYear(2020, 2019).direction).toBe("up");
    expect(compareYear(2019, 2020).direction).toBe("down");
  });

  it("treats two unknown years as a match, so the target is always winnable", () => {
    expect(compareYear(null, null)).toEqual({ state: "correct", direction: null });
  });

  it("gives no direction when only one side is known", () => {
    // There is no honest arrow to draw against an unknown year.
    expect(compareYear(2019, null)).toEqual({ state: "incorrect", direction: null });
    expect(compareYear(null, 2019)).toEqual({ state: "incorrect", direction: null });
  });
});
