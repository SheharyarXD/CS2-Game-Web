/**
 * Profile levelling and service medals.
 *
 * Mirrors the game's own progression: a player climbs profile levels, and
 * on reaching the top level their level resets and they are awarded that
 * calendar year's Service Medal. Once the year's medal has been earned the
 * level keeps climbing without resetting again until the new year begins,
 * at which point the next year's medal becomes available.
 *
 * Every value is derived from the player's REAL recorded activity (see
 * lib/server/playerStats.ts) — a new player genuinely starts at level 1
 * with no medals. Thresholds live here so they can be retuned without
 * touching any UI.
 */

export const MAX_LEVEL = 40;

/** Games needed to advance one level. */
export const GAMES_PER_LEVEL = 3;

export interface LevelInput {
  /** Games completed since the last level reset. */
  gamesTowardLevel: number;
  /** Whether this player already holds the current year's service medal. */
  hasCurrentYearMedal: boolean;
}

export interface LevelProgress {
  level: number;
  /** 0-100 progress through the current level. */
  percent: number;
  gamesIntoLevel: number;
  gamesPerLevel: number;
  /** True once the player is at max level and has not yet been awarded the medal. */
  atMaxLevel: boolean;
}

export function getLevelProgress({ gamesTowardLevel, hasCurrentYearMedal }: LevelInput): LevelProgress {
  const rawLevel = Math.floor(gamesTowardLevel / GAMES_PER_LEVEL) + 1;

  // Before the year's medal is earned the level is capped at MAX_LEVEL,
  // which is the point the reset and award happen. Afterwards it climbs
  // freely for the rest of the year.
  const level = hasCurrentYearMedal ? rawLevel : Math.min(rawLevel, MAX_LEVEL);
  const gamesIntoLevel = gamesTowardLevel % GAMES_PER_LEVEL;
  const atMaxLevel = !hasCurrentYearMedal && level >= MAX_LEVEL;

  return {
    level,
    percent: atMaxLevel ? 100 : Math.round((gamesIntoLevel / GAMES_PER_LEVEL) * 100),
    gamesIntoLevel,
    gamesPerLevel: GAMES_PER_LEVEL,
    atMaxLevel,
  };
}

/**
 * How many completed games are required to reach max level, i.e. the point
 * at which the level resets and the year's service medal is awarded.
 */
export const GAMES_TO_MAX_LEVEL = (MAX_LEVEL - 1) * GAMES_PER_LEVEL;

export interface ServiceMedal {
  year: number;
  label: string;
}

export function serviceMedalFor(year: number): ServiceMedal {
  return { year, label: `${year} Service Medal` };
}

export interface Medal {
  key: string;
  label: string;
  earned: boolean;
}

export interface MedalInput {
  gamesPlayed: number;
  dailyStreak: number;
  daysPlayed: number;
}

/** Achievement slots on the player card, lit only when actually earned. */
export function getMedals(stats: MedalInput): Medal[] {
  return [
    { key: "first-game", label: "Finish your first game", earned: stats.gamesPlayed >= 1 },
    { key: "streak-3", label: "3 day daily streak", earned: stats.dailyStreak >= 3 },
    { key: "streak-7", label: "7 day daily streak", earned: stats.dailyStreak >= 7 },
    { key: "games-10", label: "Play 10 games", earned: stats.gamesPlayed >= 10 },
    { key: "games-25", label: "Play 25 games", earned: stats.gamesPlayed >= 25 },
    { key: "days-14", label: "Play on 14 different days", earned: stats.daysPlayed >= 14 },
  ];
}
