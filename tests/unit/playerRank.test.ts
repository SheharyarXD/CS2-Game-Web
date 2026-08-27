import { describe, expect, it } from "vitest";
import {
  GAMES_PER_LEVEL,
  GAMES_TO_MAX_LEVEL,
  MAX_LEVEL,
  getLevelProgress,
  getMedals,
  serviceMedalFor,
} from "@/lib/game/playerRank";

describe("getLevelProgress", () => {
  it("starts a brand new player at level 1 with no progress", () => {
    const p = getLevelProgress({ gamesTowardLevel: 0, hasCurrentYearMedal: false });
    expect(p.level).toBe(1);
    expect(p.percent).toBe(0);
    expect(p.atMaxLevel).toBe(false);
  });

  it("advances one level per configured number of games", () => {
    expect(getLevelProgress({ gamesTowardLevel: GAMES_PER_LEVEL, hasCurrentYearMedal: false }).level).toBe(2);
    expect(getLevelProgress({ gamesTowardLevel: GAMES_PER_LEVEL * 4, hasCurrentYearMedal: false }).level).toBe(5);
  });

  it("caps at max level while this year's medal is still outstanding", () => {
    const p = getLevelProgress({ gamesTowardLevel: GAMES_TO_MAX_LEVEL + 50, hasCurrentYearMedal: false });
    expect(p.level).toBe(MAX_LEVEL);
    expect(p.atMaxLevel).toBe(true);
    expect(p.percent).toBe(100);
  });

  it("keeps climbing past max level once the year's medal is held", () => {
    const p = getLevelProgress({ gamesTowardLevel: GAMES_TO_MAX_LEVEL + 50, hasCurrentYearMedal: true });
    expect(p.level).toBeGreaterThan(MAX_LEVEL);
    expect(p.atMaxLevel).toBe(false);
  });
});

describe("serviceMedalFor", () => {
  it("labels the medal with its year", () => {
    expect(serviceMedalFor(2026)).toEqual({ year: 2026, label: "2026 Service Medal" });
  });
});

describe("getMedals", () => {
  it("lights nothing for a player with no activity", () => {
    const medals = getMedals({ gamesPlayed: 0, dailyStreak: 0, daysPlayed: 0 });
    expect(medals.every((m) => !m.earned)).toBe(true);
  });

  it("lights only the thresholds actually reached", () => {
    const medals = getMedals({ gamesPlayed: 10, dailyStreak: 3, daysPlayed: 2 });
    const earned = medals.filter((m) => m.earned).map((m) => m.key);
    expect(earned).toContain("first-game");
    expect(earned).toContain("streak-3");
    expect(earned).toContain("games-10");
    expect(earned).not.toContain("streak-7");
    expect(earned).not.toContain("games-25");
    expect(earned).not.toContain("days-14");
  });
});
