import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  DuplicateGuessError,
  activateClue,
  getOrStartDailySession,
  getSkinSessionState,
  startUnlimitedSession,
  submitSkinGuess,
} from "@/lib/server/skinGame";
import { dateKeyUTC } from "@/lib/game/dailyTarget";

/**
 * Integration tests for the rules the server has to enforce itself:
 * duplicate guesses, clue thresholds, the exact-identity win condition
 * and daily/unlimited separation.
 *
 * These run against the real database. Every test uses its own random
 * session token, and all rows created are removed afterwards, so runs
 * don't interfere with each other or with a developer's own progress.
 */
const prisma = new PrismaClient();
const tokens: string[] = [];

function newToken(): string {
  const token = `test-${randomUUID()}`;
  tokens.push(token);
  return token;
}

/** A handful of real skin ids to guess with, none of them the target. */
async function decoyIds(excludeId: string, count: number): Promise<string[]> {
  const skins = await prisma.skin.findMany({
    where: { active: true, id: { not: excludeId } },
    select: { id: true },
    take: count,
  });
  return skins.map((s) => s.id);
}

beforeAll(async () => {
  const activeSkins = await prisma.skin.count({ where: { active: true } });
  if (activeSkins < 10) {
    throw new Error(
      `Integration tests need a seeded database (found ${activeSkins} active skins). Run \`npm run seed:skins\`.`,
    );
  }
});

afterAll(async () => {
  // Remove everything these tests created, children first.
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

describe("daily mode", () => {
  it("returns the same session and target for the same player on the same day", async () => {
    const token = newToken();
    const first = await getOrStartDailySession(token);
    const second = await getOrStartDailySession(token);

    expect(second.sessionId).toBe(first.sessionId);
    expect(second.dateKey).toBe(dateKeyUTC());
    expect(second.mode).toBe("DAILY_SKIN");
  });

  it("gives two different players the same daily target", async () => {
    const a = await getOrStartDailySession(newToken());
    const b = await getOrStartDailySession(newToken());

    const [sa, sb] = await Promise.all([
      prisma.gameSession.findUnique({ where: { id: a.sessionId }, select: { targetSkinId: true } }),
      prisma.gameSession.findUnique({ where: { id: b.sessionId }, select: { targetSkinId: true } }),
    ]);
    expect(sa!.targetSkinId).toBe(sb!.targetSkinId);
  });

  it("never exposes the target while the round is in progress", async () => {
    const state = await getOrStartDailySession(newToken());
    expect(state.status).toBe("IN_PROGRESS");
    expect(state.target).toBeNull();
    expect(state.clues.every((c) => c.value === null)).toBe(true);
  });

  it("does not resurrect a previous day's game as today's", async () => {
    const token = newToken();
    const today = await getOrStartDailySession(token);

    // Backdate the session, then ask again: a fresh session for today
    // must be created rather than yesterday's being handed back.
    const yesterday = dateKeyUTC(new Date(Date.now() - 86_400_000));
    await prisma.gameSession.update({ where: { id: today.sessionId }, data: { dateKey: yesterday } });

    const fresh = await getOrStartDailySession(token);
    expect(fresh.sessionId).not.toBe(today.sessionId);
    expect(fresh.dateKey).toBe(dateKeyUTC());
    expect(fresh.guesses).toHaveLength(0);
  });
});

describe("guess submission", () => {
  it("records a wrong guess and keeps the round open", async () => {
    const token = newToken();
    const state = await getOrStartDailySession(token);
    const target = await prisma.gameSession.findUnique({
      where: { id: state.sessionId },
      select: { targetSkinId: true },
    });
    const [decoy] = await decoyIds(target!.targetSkinId!, 1);

    const after = await submitSkinGuess(state.sessionId, token, decoy!);
    expect(after.guesses).toHaveLength(1);
    expect(after.status).toBe("IN_PROGRESS");
    expect(after.target).toBeNull();
  });

  it("rejects a duplicate guess without adding a row", async () => {
    const token = newToken();
    const state = await startUnlimitedSession(token);
    const target = await prisma.gameSession.findUnique({
      where: { id: state.sessionId },
      select: { targetSkinId: true },
    });
    const [decoy] = await decoyIds(target!.targetSkinId!, 1);

    await submitSkinGuess(state.sessionId, token, decoy!);
    await expect(submitSkinGuess(state.sessionId, token, decoy!)).rejects.toBeInstanceOf(DuplicateGuessError);

    const after = await getSkinSessionState(state.sessionId, token);
    expect(after.guesses).toHaveLength(1);
  });

  it("rejects an unknown skin id", async () => {
    const token = newToken();
    const state = await startUnlimitedSession(token);
    await expect(submitSkinGuess(state.sessionId, token, "skin-does-not-exist")).rejects.toThrow(/Unknown skin/);
  });

  it("wins only on the exact target skin", async () => {
    const token = newToken();
    const state = await startUnlimitedSession(token);
    const target = await prisma.gameSession.findUnique({
      where: { id: state.sessionId },
      select: { targetSkinId: true },
    });

    const won = await submitSkinGuess(state.sessionId, token, target!.targetSkinId!);
    expect(won.status).toBe("WON");
    expect(won.target).not.toBeNull();
    expect(won.target!.id).toBe(target!.targetSkinId);
  });

  it("refuses a session belonging to a different player", async () => {
    const owner = newToken();
    const state = await startUnlimitedSession(owner);
    await expect(getSkinSessionState(state.sessionId, newToken())).rejects.toThrow(/not found/);
  });
});

describe("clue thresholds", () => {
  /** Plays `n` wrong guesses against a fresh unlimited game. */
  async function gameWithGuesses(n: number) {
    const token = newToken();
    const state = await startUnlimitedSession(token);
    const session = await prisma.gameSession.findUnique({
      where: { id: state.sessionId },
      select: { targetSkinId: true },
    });
    const decoys = await decoyIds(session!.targetSkinId!, n);
    for (const id of decoys) {
      await submitSkinGuess(state.sessionId, token, id);
    }
    return { token, sessionId: state.sessionId };
  }

  it("keeps every clue locked before 3 guesses", async () => {
    const { token, sessionId } = await gameWithGuesses(2);
    const state = await getSkinSessionState(sessionId, token);
    expect(state.clues.every((c) => !c.unlocked)).toBe(true);
    expect(state.clues.every((c) => c.value === null)).toBe(true);
  });

  it("refuses to reveal a clue before its threshold", async () => {
    const { token, sessionId } = await gameWithGuesses(2);
    await expect(activateClue(sessionId, token, "collection")).rejects.toThrow(/unlocks after 3 guesses/);
  });

  it("unlocks Case at 3 guesses but not Rarity or Colour", async () => {
    const { token, sessionId } = await gameWithGuesses(3);
    const state = await getSkinSessionState(sessionId, token);
    const byKey = Object.fromEntries(state.clues.map((c) => [c.key, c]));

    expect(byKey.collection!.unlocked).toBe(true);
    expect(byKey.rarity!.unlocked).toBe(false);
    expect(byKey.color!.unlocked).toBe(false);

    const revealed = await activateClue(sessionId, token, "collection");
    expect(revealed.clues.find((c) => c.key === "collection")!.value).toBeTruthy();
    // The other two must still be withheld.
    expect(revealed.clues.find((c) => c.key === "rarity")!.value).toBeNull();
    expect(revealed.clues.find((c) => c.key === "color")!.value).toBeNull();
  });

  it("unlocks Rarity at 5 guesses", async () => {
    const { token, sessionId } = await gameWithGuesses(5);
    await expect(activateClue(sessionId, token, "color")).rejects.toThrow(/unlocks after 7 guesses/);

    const revealed = await activateClue(sessionId, token, "rarity");
    expect(revealed.clues.find((c) => c.key === "rarity")!.value).toBeTruthy();
  });

  it("unlocks Colour at 7 guesses and reveals a real colour", async () => {
    const { token, sessionId } = await gameWithGuesses(7);
    const revealed = await activateClue(sessionId, token, "color");
    const colour = revealed.clues.find((c) => c.key === "color")!.value;

    expect(colour).toBeTruthy();
    const target = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { targetSkin: { select: { color: true } } },
    });
    expect(colour).toBe(target!.targetSkin!.color);
  });

  it("is idempotent: revealing the same clue twice changes nothing", async () => {
    const { token, sessionId } = await gameWithGuesses(3);
    const once = await activateClue(sessionId, token, "collection");
    const twice = await activateClue(sessionId, token, "collection");
    expect(twice.clues).toEqual(once.clues);
  });
});

describe("mode separation", () => {
  it("keeps unlimited play from touching the daily game", async () => {
    const token = newToken();
    const daily = await getOrStartDailySession(token);
    const dailyTarget = await prisma.gameSession.findUnique({
      where: { id: daily.sessionId },
      select: { targetSkinId: true },
    });

    // Play and finish an unlimited round on the same player.
    const unlimited = await startUnlimitedSession(token);
    const unlimitedTarget = await prisma.gameSession.findUnique({
      where: { id: unlimited.sessionId },
      select: { targetSkinId: true },
    });
    await submitSkinGuess(unlimited.sessionId, token, unlimitedTarget!.targetSkinId!);

    const dailyAfter = await getOrStartDailySession(token);
    expect(dailyAfter.sessionId).toBe(daily.sessionId);
    expect(dailyAfter.status).toBe("IN_PROGRESS");
    expect(dailyAfter.guesses).toHaveLength(0);

    const dailyTargetAfter = await prisma.gameSession.findUnique({
      where: { id: daily.sessionId },
      select: { targetSkinId: true },
    });
    expect(dailyTargetAfter!.targetSkinId).toBe(dailyTarget!.targetSkinId);
  });

  it("gives each unlimited round its own session", async () => {
    const token = newToken();
    const first = await startUnlimitedSession(token);
    const second = await startUnlimitedSession(token);
    expect(second.sessionId).not.toBe(first.sessionId);
    expect(second.guesses).toHaveLength(0);
  });
});
