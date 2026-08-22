import { gameConfig } from "@/lib/game/config";
import { revealPercentForGuessCount } from "@/lib/game/mapGame";
import { prisma } from "./db";
import { toNormalizedMap } from "./normalize";

export interface MapGuessEntry {
  guessOrder: number;
  mapId: string;
  mapName: string;
  correct: boolean;
}

export interface MapGameStateDTO {
  sessionId: string;
  status: "IN_PROGRESS" | "WON" | "LOST";
  guesses: MapGuessEntry[];
  guessesRemaining: number;
  revealPercent: number;
  focalX: number;
  focalY: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  target: { id: string; name: string; imageUrl: string } | null; // only once over
}

async function loadSession(sessionId: string) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { targetMap: true, guesses: { orderBy: { guessOrder: "asc" } } },
  });
  if (!session || !session.targetMap) return null;
  const targetMap = session.targetMap;
  return { ...session, targetMap };
}

async function buildStateDTO(session: NonNullable<Awaited<ReturnType<typeof loadSession>>>): Promise<MapGameStateDTO> {
  const mapIds = session.guesses.map((g) => g.guessedMapId).filter((id): id is string => !!id);
  const maps = mapIds.length ? await prisma.gameMap.findMany({ where: { id: { in: mapIds } } }) : [];
  const mapById = new Map(maps.map((m) => [m.id, m]));

  const guesses: MapGuessEntry[] = session.guesses
    .filter((g) => g.guessedMapId)
    .map((g) => {
      const parsed = JSON.parse(g.result) as { correct: boolean };
      return {
        guessOrder: g.guessOrder,
        mapId: g.guessedMapId!,
        mapName: mapById.get(g.guessedMapId!)?.name ?? g.guessedMapId!,
        correct: parsed.correct,
      };
    });

  const revealPercent =
    session.status === "IN_PROGRESS"
      ? revealPercentForGuessCount(guesses.length)
      : 100;

  const isOver = session.status !== "IN_PROGRESS";
  const targetMap = toNormalizedMap(session.targetMap);

  return {
    sessionId: session.id,
    status: session.status as "IN_PROGRESS" | "WON" | "LOST",
    guesses,
    guessesRemaining: Math.max(0, gameConfig.mapMode.maxGuesses - guesses.length),
    revealPercent,
    focalX: session.targetMap.focalX,
    focalY: session.targetMap.focalY,
    imageUrl: targetMap.imageUrl,
    imageWidth: targetMap.imageWidth,
    imageHeight: targetMap.imageHeight,
    target: isOver ? { id: targetMap.id, name: targetMap.name, imageUrl: targetMap.imageUrl } : null,
  };
}

export async function startMapSession(sessionToken: string): Promise<MapGameStateDTO> {
  const pool = await prisma.gameMap.findMany({ where: { active: true }, select: { id: true } });
  if (pool.length === 0) {
    throw new Error("No active maps available. Run `npm run seed:maps`.");
  }
  const target = pool[Math.floor(Math.random() * pool.length)]!;

  const session = await prisma.gameSession.create({
    data: { sessionToken, mode: "MAP", targetMapId: target.id },
    include: { targetMap: true, guesses: true },
  });

  return buildStateDTO({ ...session, targetMap: session.targetMap! });
}

export async function getMapSessionState(sessionId: string, sessionToken: string): Promise<MapGameStateDTO> {
  const session = await loadSession(sessionId);
  if (!session || session.sessionToken !== sessionToken) {
    throw new Error("Game session not found.");
  }
  return buildStateDTO(session);
}

export async function submitMapGuess(
  sessionId: string,
  sessionToken: string,
  guessedMapId: string,
): Promise<MapGameStateDTO> {
  const session = await loadSession(sessionId);
  if (!session || session.sessionToken !== sessionToken) {
    throw new Error("Game session not found.");
  }
  if (session.status !== "IN_PROGRESS") {
    return buildStateDTO(session);
  }

  const guessedMap = await prisma.gameMap.findUnique({ where: { id: guessedMapId, active: true } });
  if (!guessedMap) {
    throw new Error("Unknown or inactive map id.");
  }

  const correct = guessedMap.id === session.targetMapId;
  const guessOrder = session.guesses.length + 1;
  const isFinalAttempt = guessOrder >= gameConfig.mapMode.maxGuesses;
  const nextStatus: "IN_PROGRESS" | "WON" | "LOST" = correct ? "WON" : isFinalAttempt ? "LOST" : "IN_PROGRESS";

  await prisma.$transaction([
    prisma.gameGuess.create({
      data: {
        sessionId: session.id,
        guessOrder,
        guessedMapId,
        result: JSON.stringify({ correct }),
      },
    }),
    ...(nextStatus !== "IN_PROGRESS"
      ? [
          prisma.gameSession.update({
            where: { id: session.id },
            data: { status: nextStatus, completedAt: new Date() },
          }),
        ]
      : []),
  ]);

  const refreshed = await loadSession(sessionId);
  return buildStateDTO(refreshed!);
}
