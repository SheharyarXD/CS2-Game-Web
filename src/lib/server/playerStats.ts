import { dateKeyUTC } from "@/lib/game/dailyTarget";
import { GAMES_TO_MAX_LEVEL } from "@/lib/game/playerRank";
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
  gamesTowardLevel: number;
  serviceMedals: number[];
  hasCurrentYearMedal: boolean;
  agent: { id: string; shortName: string; imageUrl: string; team: string } | null;
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

/**
 * Call once when any game session reaches WON/LOST.
 *
 * Also advances profile levelling: reaching max level resets the level
 * counter and awards the current year's service medal. Once that medal is
 * held, the counter keeps climbing (no further reset) until the calendar
 * year rolls over and the next year's medal becomes available.
 */
export async function recordGameCompleted(sessionToken: string): Promise<void> {
  const year = new Date().getUTCFullYear();
  const existing = await prisma.playerStats.findUnique({ where: { sessionToken } });

  if (!existing) {
    await prisma.playerStats.create({
      data: { sessionToken, gamesPlayed: 1, gamesTowardLevel: 1 },
    });
    return;
  }

  const medals = JSON.parse(existing.serviceMedals) as number[];
  const hasThisYear = medals.includes(year);
  const nextTowardLevel = existing.gamesTowardLevel + 1;

  // Award the medal and reset the level only while this year's medal is
  // still outstanding.
  const earnsMedal = !hasThisYear && nextTowardLevel >= GAMES_TO_MAX_LEVEL;

  await prisma.playerStats.update({
    where: { sessionToken },
    data: {
      gamesPlayed: existing.gamesPlayed + 1,
      gamesTowardLevel: earnsMedal ? 0 : nextTowardLevel,
      serviceMedals: earnsMedal ? JSON.stringify([...medals, year]) : existing.serviceMedals,
    },
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
  const stats = await prisma.playerStats.findUnique({
    where: { sessionToken },
    include: { agent: true },
  });

  const year = new Date().getUTCFullYear();
  const medals = stats ? (JSON.parse(stats.serviceMedals) as number[]) : [];

  return {
    gamesPlayed: stats?.gamesPlayed ?? 0,
    dailyStreak: stats?.dailyStreak ?? 0,
    daysPlayed: stats?.daysPlayed ?? 0,
    gamesTowardLevel: stats?.gamesTowardLevel ?? 0,
    serviceMedals: medals,
    hasCurrentYearMedal: medals.includes(year),
    agent: stats?.agent
      ? {
          id: stats.agent.id,
          shortName: stats.agent.shortName,
          imageUrl: stats.agent.imageUrl,
          team: stats.agent.team,
        }
      : null,
  };
}

/** Sets the player's chosen agent portrait. Validates the agent exists. */
export async function setPlayerAgent(sessionToken: string, agentId: string): Promise<PlayerStatsDTO> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId, active: true } });
  if (!agent) throw new Error("Unknown agent.");

  await prisma.playerStats.upsert({
    where: { sessionToken },
    update: { agentId },
    create: { sessionToken, agentId },
  });

  return getPlayerStats(sessionToken);
}
