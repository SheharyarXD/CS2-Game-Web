import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { getOrStartDailySession, submitSkinGuess } from "@/lib/server/skinGame";
import { getPlayerStats, recordDailyWin } from "@/lib/server/playerStats";
import { dateKeyUTC } from "@/lib/game/dailyTarget";
import { GAMES_TO_MAX_LEVEL } from "@/lib/game/playerRank";

/**
 * The daily streak and the service medal are the two pieces of progression
 * that must only ever move on real gameplay. These tests drive the same
 * functions the API routes call.
 */
const prisma = new PrismaClient();
const tokens: string[] = [];

function newToken(): string {
  const token = `test-${randomUUID()}`;
  tokens.push(token);
  return token;
}

function daysAgo(n: number): string {
  return dateKeyUTC(new Date(Date.now() - n * 86_400_000));
}

afterAll(async () => {
  const sessions = await prisma.gameSession.findMany({
    where: { sessionToken: { in: tokens } },
    select: { id: true },
  });
  const ids = sessions.map((s) => s.id);
  if (ids.length) {
    await prisma.gameGuess.deleteMany({ where: { sessionId: { in: ids } } });
    await prisma.gameSession.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.playerStats.deleteMany({ where: { sessionToken: { in: tokens } } });
  await prisma.$disconnect();
});

describe("daily streak", () => {
  it("starts at zero and does not move just from opening the game", async () => {
    const token = newToken();
    await getOrStartDailySession(token);
    const stats = await getPlayerStats(token);
    expect(stats.dailyStreak).toBe(0);
    expect(stats.gamesPlayed).toBe(0);
  });

  it("advances to 1 on the first daily win", async () => {
    const token = newToken();
    const state = await getOrStartDailySession(token);
    const session = await prisma.gameSession.findUnique({
      where: { id: state.sessionId },
      select: { targetSkinId: true },
    });

    const won = await submitSkinGuess(state.sessionId, token, session!.targetSkinId!);
    expect(won.status).toBe("WON");

    const stats = await getPlayerStats(token);
    expect(stats.dailyStreak).toBe(1);
    expect(stats.gamesPlayed).toBe(1);
  });

  it("does not count the same day twice", async () => {
    const token = newToken();
    await recordDailyWin(token, dateKeyUTC());
    await recordDailyWin(token, dateKeyUTC());
    expect((await getPlayerStats(token)).dailyStreak).toBe(1);
  });

  it("extends the streak on consecutive days", async () => {
    const token = newToken();
    await recordDailyWin(token, daysAgo(2));
    await recordDailyWin(token, daysAgo(1));
    await recordDailyWin(token, daysAgo(0));
    expect((await getPlayerStats(token)).dailyStreak).toBe(3);
  });

  it("resets to 1 when a day is missed", async () => {
    const token = newToken();
    await recordDailyWin(token, daysAgo(5));
    await recordDailyWin(token, daysAgo(4));
    expect((await getPlayerStats(token)).dailyStreak).toBe(2);

    // Skip a day, then win again.
    await recordDailyWin(token, daysAgo(1));
    expect((await getPlayerStats(token)).dailyStreak).toBe(1);
  });
});

describe("service medal", () => {
  it("is not awarded before the level cap is reached", async () => {
    const token = newToken();
    await prisma.playerStats.create({
      data: { sessionToken: token, gamesTowardLevel: GAMES_TO_MAX_LEVEL - 2, gamesPlayed: 10 },
    });
    const stats = await getPlayerStats(token);
    expect(stats.serviceMedals).toHaveLength(0);
    expect(stats.hasCurrentYearMedal).toBe(false);
  });

  it("awards this year's medal and resets the level at the cap", async () => {
    const token = newToken();
    const state = await getOrStartDailySession(token);
    const session = await prisma.gameSession.findUnique({
      where: { id: state.sessionId },
      select: { targetSkinId: true },
    });

    // Sit one completed game short of the cap, then finish a real game.
    await prisma.playerStats.create({
      data: { sessionToken: token, gamesTowardLevel: GAMES_TO_MAX_LEVEL - 1, gamesPlayed: 50 },
    });
    await submitSkinGuess(state.sessionId, token, session!.targetSkinId!);

    const stats = await getPlayerStats(token);
    const year = new Date().getUTCFullYear();
    expect(stats.serviceMedals).toContain(year);
    expect(stats.hasCurrentYearMedal).toBe(true);
    // Level counter resets so progression starts again from the bottom.
    expect(stats.gamesTowardLevel).toBe(0);
  });
});
