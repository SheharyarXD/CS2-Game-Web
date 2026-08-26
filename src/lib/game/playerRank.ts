/**
 * Rank and medal derivation.
 *
 * The menu's player card has slots for a rank, a progress rail and a row
 * of medals. Every value here is derived deterministically from the
 * player's REAL recorded stats (see lib/server/playerStats.ts) — a fresh
 * player genuinely sits at the first rank with zero medals lit. Nothing
 * on the card is decorative filler.
 *
 * Thresholds live here so they can be retuned without touching the UI.
 */

export interface PlayerStatsInput {
  gamesPlayed: number;
  dailyStreak: number;
  daysPlayed: number;
}

export interface RankTier {
  name: string;
  /** Games needed to enter this tier. */
  at: number;
}

export const RANK_TIERS: RankTier[] = [
  { name: "Recruit", at: 0 },
  { name: "Private", at: 3 },
  { name: "Corporal", at: 8 },
  { name: "Sergeant", at: 15 },
  { name: "Lieutenant", at: 25 },
  { name: "Captain", at: 40 },
  { name: "Major", at: 60 },
  { name: "Colonel", at: 85 },
  { name: "Brigadier", at: 115 },
  { name: "Elite", at: 150 },
];

export interface RankProgress {
  tierIndex: number;
  tierName: string;
  nextTierName: string | null;
  /** 0-100, progress through the current tier toward the next one. */
  percent: number;
  gamesIntoTier: number;
  gamesNeededForTier: number;
}

export function getRankProgress(gamesPlayed: number): RankProgress {
  let tierIndex = 0;
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (gamesPlayed >= RANK_TIERS[i]!.at) {
      tierIndex = i;
      break;
    }
  }

  const current = RANK_TIERS[tierIndex]!;
  const next = RANK_TIERS[tierIndex + 1] ?? null;

  if (!next) {
    return {
      tierIndex,
      tierName: current.name,
      nextTierName: null,
      percent: 100,
      gamesIntoTier: gamesPlayed - current.at,
      gamesNeededForTier: 0,
    };
  }

  const span = next.at - current.at;
  const into = gamesPlayed - current.at;
  return {
    tierIndex,
    tierName: current.name,
    nextTierName: next.name,
    percent: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
    gamesIntoTier: into,
    gamesNeededForTier: span,
  };
}

export interface Medal {
  key: string;
  label: string;
  earned: boolean;
}

/** The six medal slots on the player card, lit only when actually earned. */
export function getMedals(stats: PlayerStatsInput): Medal[] {
  return [
    { key: "first-game", label: "Finish your first game", earned: stats.gamesPlayed >= 1 },
    { key: "streak-3", label: "3 day daily streak", earned: stats.dailyStreak >= 3 },
    { key: "streak-7", label: "7 day daily streak", earned: stats.dailyStreak >= 7 },
    { key: "games-10", label: "Play 10 games", earned: stats.gamesPlayed >= 10 },
    { key: "games-25", label: "Play 25 games", earned: stats.gamesPlayed >= 25 },
    { key: "days-14", label: "Play on 14 different days", earned: stats.daysPlayed >= 14 },
  ];
}
