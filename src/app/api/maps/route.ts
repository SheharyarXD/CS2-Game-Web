import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { handleUnexpected } from "@/lib/server/apiError";

export async function GET() {
  try {
    const maps = await prisma.gameMap.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(maps);
  } catch (err) {
    return handleUnexpected(err);
  }
}
