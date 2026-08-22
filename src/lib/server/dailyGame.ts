import { dailyIndexForDate, dateKeyUTC } from "@/lib/game/dailyTarget";
import { prisma } from "./db";

/**
 * Returns (creating if necessary) the skin id assigned to `dateKey`.
 *
 * The assignment is computed once and persisted in DailySkinGame so it is
 * stable even if the active skin pool changes size later (re-hashing on
 * every request could otherwise shift historical days). If the hash lands
 * on the same skin used the previous day, the index is nudged forward by
 * one to avoid an immediate repeat.
 */
export async function getOrCreateDailySkinId(dateKey: string = dateKeyUTC()): Promise<string> {
  const existing = await prisma.dailySkinGame.findUnique({ where: { dateKey } });
  if (existing) return existing.skinId;

  const pool = await prisma.skin.findMany({
    where: { active: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  if (pool.length === 0) {
    throw new Error("Cannot select a daily skin: no active skins in the database. Run `npm run seed:skins`.");
  }

  let index = dailyIndexForDate(dateKey, pool.length);

  const yesterday = dateKeyUTC(new Date(new Date(`${dateKey}T00:00:00.000Z`).getTime() - 86_400_000));
  const previous = await prisma.dailySkinGame.findUnique({ where: { dateKey: yesterday } });
  if (previous && pool[index]?.id === previous.skinId && pool.length > 1) {
    index = (index + 1) % pool.length;
  }

  const skinId = pool[index]!.id;

  // Upsert to stay safe under concurrent first-requests for the same day.
  const created = await prisma.dailySkinGame.upsert({
    where: { dateKey },
    update: {},
    create: { dateKey, skinId },
  });
  return created.skinId;
}
