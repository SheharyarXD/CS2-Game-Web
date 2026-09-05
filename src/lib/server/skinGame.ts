import { gameConfig } from "@/lib/game/config";
import { dateKeyUTC, msUntilNextUtcMidnight } from "@/lib/game/dailyTarget";
import { compareSkin } from "@/lib/game/skinComparison";
import type { ClueKey, SkinComparisonResult } from "@/lib/game/types";
import { getOrCreateDailySkinId } from "./dailyGame";
import { prisma } from "./db";
import { toNormalizedSkin, toSkinSummary, type SkinSummary } from "./normalize";
import { recordActivity, recordDailyWin, recordGameCompleted } from "./playerStats";

/** Thrown when a skin already guessed in this game is submitted again. */
export class DuplicateGuessError extends Error {
  constructor(public readonly displayName: string) {
    super(`You already guessed ${displayName}.`);
    this.name = "DuplicateGuessError";
  }
}

export interface GuessHistoryEntry {
  guessOrder: number;
  skin: SkinSummary;
  result: SkinComparisonResult;
}

export interface ClueState {
  key: ClueKey;
  revealed: boolean;
  value: string | null;
  /** Guesses that must be submitted before this clue can be revealed. */
  unlocksAfter: number;
  /** False while the player still owes guesses before it becomes available. */
  unlocked: boolean;
}

export interface SkinGameStateDTO {
  sessionId: string;
  mode: "DAILY_SKIN" | "UNLIMITED_SKIN";
  status: "IN_PROGRESS" | "WON" | "LOST";
  guesses: GuessHistoryEntry[];
  clues: ClueState[];
  target: SkinSummary | null; // only populated once the game is over
  nextResetAt: string | null; // ISO timestamp, DAILY_SKIN only
  /** UTC calendar day this daily game belongs to, "YYYY-MM-DD". Daily only. */
  dateKey: string | null;
}

async function loadSession(sessionId: string) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      targetSkin: true,
      guesses: { orderBy: { guessOrder: "asc" } },
    },
  });
  if (!session || !session.targetSkin) return null;
  const targetSkin = session.targetSkin;
  return { ...session, targetSkin };
}

async function buildStateDTO(
  session: NonNullable<Awaited<ReturnType<typeof loadSession>>>,
): Promise<SkinGameStateDTO> {
  const guessedSkinIds = session.guesses.map((g) => g.guessedSkinId).filter((id): id is string => !!id);
  const guessedSkins = guessedSkinIds.length
    ? await prisma.skin.findMany({ where: { id: { in: guessedSkinIds } } })
    : [];
  const skinById = new Map(guessedSkins.map((s) => [s.id, s]));

  const guesses: GuessHistoryEntry[] = session.guesses
    .filter((g) => g.guessedSkinId)
    .map((g) => ({
      guessOrder: g.guessOrder,
      skin: toSkinSummary(skinById.get(g.guessedSkinId!)!),
      result: JSON.parse(g.result) as SkinComparisonResult,
    }));

  const cluesUsed = JSON.parse(session.cluesUsed) as ClueKey[];
  const clues: ClueState[] = gameConfig.skinMode.clues.map(({ key, unlocksAfter }) => {
    const revealed = cluesUsed.includes(key);
    return {
      key,
      revealed,
      value: revealed ? cluePayload(key, session.targetSkin) : null,
      unlocksAfter,
      unlocked: guesses.length >= unlocksAfter,
    };
  });

  const isOver = session.status !== "IN_PROGRESS";

  return {
    sessionId: session.id,
    mode: session.mode as "DAILY_SKIN" | "UNLIMITED_SKIN",
    status: session.status as "IN_PROGRESS" | "WON" | "LOST",
    guesses,
    clues,
    target: isOver ? toSkinSummary(session.targetSkin) : null,
    nextResetAt:
      session.mode === "DAILY_SKIN" ? new Date(Date.now() + msUntilNextUtcMidnight()).toISOString() : null,
    dateKey: session.mode === "DAILY_SKIN" ? session.dateKey : null,
  };
}

/**
 * The value revealed by a clue. Only ever called for clues the player has
 * actually unlocked and revealed — buildStateDTO passes null otherwise,
 * so an un-revealed clue's value never reaches the client.
 */
function cluePayload(
  key: ClueKey,
  skin: { caseOrCollection: string | null; rarity: string; color: string },
): string {
  if (key === "collection") return skin.caseOrCollection ?? "No collection";
  if (key === "rarity") return skin.rarity;
  return skin.color;
}

export async function getOrStartDailySession(sessionToken: string): Promise<SkinGameStateDTO> {
  const dateKey = dateKeyUTC();
  let session = await prisma.gameSession.findUnique({
    where: { sessionToken_mode_dateKey: { sessionToken, mode: "DAILY_SKIN", dateKey } },
    include: { targetSkin: true, guesses: { orderBy: { guessOrder: "asc" } } },
  });

  if (!session) {
    const skinId = await getOrCreateDailySkinId(dateKey);
    session = await prisma.gameSession.create({
      data: { sessionToken, mode: "DAILY_SKIN", dateKey, targetSkinId: skinId },
      include: { targetSkin: true, guesses: { orderBy: { guessOrder: "asc" } } },
    });
  }

  return buildStateDTO({ ...session, targetSkin: session.targetSkin! });
}

export async function startUnlimitedSession(sessionToken: string): Promise<SkinGameStateDTO> {
  const pool = await prisma.skin.findMany({ where: { active: true }, select: { id: true } });
  if (pool.length === 0) {
    throw new Error("No active skins available. Run `npm run seed:skins`.");
  }
  const target = pool[Math.floor(Math.random() * pool.length)]!;

  const session = await prisma.gameSession.create({
    data: { sessionToken, mode: "UNLIMITED_SKIN", targetSkinId: target.id },
    include: { targetSkin: true, guesses: true },
  });

  return buildStateDTO({ ...session, targetSkin: session.targetSkin! });
}

export async function getSkinSessionState(sessionId: string, sessionToken: string): Promise<SkinGameStateDTO> {
  const session = await loadSession(sessionId);
  if (!session || session.sessionToken !== sessionToken) {
    throw new Error("Game session not found.");
  }
  return buildStateDTO(session);
}

export async function submitSkinGuess(
  sessionId: string,
  sessionToken: string,
  guessedSkinId: string,
): Promise<SkinGameStateDTO> {
  const session = await loadSession(sessionId);
  if (!session || session.sessionToken !== sessionToken) {
    throw new Error("Game session not found.");
  }
  if (session.status !== "IN_PROGRESS") {
    return buildStateDTO(session);
  }

  const guessedSkin = await prisma.skin.findUnique({ where: { id: guessedSkinId } });
  if (!guessedSkin) {
    throw new Error("Unknown skin id.");
  }

  // Reject a repeat of a skin already guessed in this game. Enforced here
  // as well as in the UI so a double-submit (or a direct API call) can't
  // append a duplicate row or inflate the guess count.
  if (session.guesses.some((g) => g.guessedSkinId === guessedSkinId)) {
    throw new DuplicateGuessError(guessedSkin.displayName);
  }

  const result = compareSkin(toNormalizedSkin(guessedSkin), toNormalizedSkin(session.targetSkin));
  // The win is decided by skin identity, never by the comparison result:
  // with four attributes, two distinct skins can share all of them.
  const won = guessedSkin.id === session.targetSkinId;
  const guessOrder = session.guesses.length + 1;

  await prisma.$transaction([
    prisma.gameGuess.create({
      data: {
        sessionId: session.id,
        guessOrder,
        guessedSkinId,
        result: JSON.stringify(result),
      },
    }),
    ...(won
      ? [
          prisma.gameSession.update({
            where: { id: session.id },
            data: { status: "WON", completedAt: new Date() },
          }),
        ]
      : []),
  ]);

  await recordActivity(sessionToken);
  if (won) {
    await recordGameCompleted(sessionToken);
    if (session.mode === "DAILY_SKIN" && session.dateKey) {
      await recordDailyWin(sessionToken, session.dateKey);
    }
  }

  const refreshed = await loadSession(sessionId);
  return buildStateDTO(refreshed!);
}

export async function activateClue(
  sessionId: string,
  sessionToken: string,
  clueKey: ClueKey,
): Promise<SkinGameStateDTO> {
  const session = await loadSession(sessionId);
  if (!session || session.sessionToken !== sessionToken) {
    throw new Error("Game session not found.");
  }
  const clueConfig = gameConfig.skinMode.clues.find((c) => c.key === clueKey);
  if (!clueConfig) {
    throw new Error("Unknown clue key.");
  }
  // Gate server-side as well as in the UI, so the unlock threshold can't
  // be bypassed by calling the endpoint directly.
  if (session.guesses.length < clueConfig.unlocksAfter) {
    throw new Error(`This clue unlocks after ${clueConfig.unlocksAfter} guesses.`);
  }

  const cluesUsed = JSON.parse(session.cluesUsed) as ClueKey[];
  if (!cluesUsed.includes(clueKey) && session.status === "IN_PROGRESS") {
    cluesUsed.push(clueKey);
    await prisma.gameSession.update({
      where: { id: session.id },
      data: { cluesUsed: JSON.stringify(cluesUsed) },
    });
  }

  const refreshed = await loadSession(sessionId);
  return buildStateDTO(refreshed!);
}
