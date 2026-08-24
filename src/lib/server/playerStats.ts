import { dateKeyUTC } from "@/lib/game/dailyTarget";
import { prisma } from "./db";

/**
 * Real, server-computed per-player stats, keyed by the same anonymous
 * session cookie as GameSession. Nothing here is fabricated for display —
 * if a number can't be computed from actual activity, it's 0.
 */

export interface PlayerStatsDTO {
  gamesPlayed: number;
  dailyStreak: number;
  daysPlayed: number;
}

function isYesterday(dateKey: string, candidateYesterday: string): boolean {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  const expectedYesterday = dateKeyUTC(new Date(d.getTime() - 86_400_000));
  return expectedYesterday === candidateYesterday;
}

/** Call once per guess submission (any mode). Tracks distinct days played. */
export async function recordActivity(sessionToken: string): Promise<void> {
  const today = dateKeyUTC();
  const existing = await prisma.playerStats.findUnique({ where: { sessionToken } });

  if (!existing) {
    await prisma.playerStats.create({
      data: { sessionToken, daysPlayed: 1, lastActiveDateKey: today },
    });
    return;
  }

  if (existing.lastActiveDateKey !== today) {
    await prisma.playerStats.update({
      where: { sessionToken },
      data: { daysPlayed: existing.daysPlayed + 1, lastActiveDateKey: today },
    });
  }
}

/** Call once when any game session (skin or map, daily or unlimited) reaches WON/LOST. */
export async function recordGameCompleted(sessionToken: string): Promise<void> {
  await prisma.playerStats.upsert({
    where: { sessionToken },
    update: { gamesPlayed: { increment: 1 } },
    create: { sessionToken, gamesPlayed: 1 },
  });
}

/**
 * Call once when a DAILY_SKIN session is won. Daily skin games have no
 * guess cap, so they only ever end in a win — meaning "solved the daily"
 * and "streak" can be tracked purely off consecutive win dates.
 */
export async function recordDailyWin(sessionToken: string, dateKey: string = dateKeyUTC()): Promise<void> {
  const existing = await prisma.playerStats.findUnique({ where: { sessionToken } });

  if (!existing) {
    await prisma.playerStats.create({
      data: { sessionToken, dailyStreak: 1, lastDailyDateKey: dateKey },
    });
    return;
  }

  if (existing.lastDailyDateKey === dateKey) return; // already recorded today

  const continuesStreak = existing.lastDailyDateKey ? isYesterday(dateKey, existing.lastDailyDateKey) : false;
  await prisma.playerStats.update({
    where: { sessionToken },
    data: {
      dailyStreak: continuesStreak ? existing.dailyStreak + 1 : 1,
      lastDailyDateKey: dateKey,
    },
  });
}

export async function getPlayerStats(sessionToken: string): Promise<PlayerStatsDTO> {
  const stats = await prisma.playerStats.findUnique({ where: { sessionToken } });
  return {
    gamesPlayed: stats?.gamesPlayed ?? 0,
    dailyStreak: stats?.dailyStreak ?? 0,
    daysPlayed: stats?.daysPlayed ?? 0,
  };
}
