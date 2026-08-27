import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { handleUnexpected } from "@/lib/server/apiError";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      where: { active: true },
      select: { id: true, shortName: true, imageUrl: true, team: true, rarity: true },
      orderBy: [{ team: "asc" }, { shortName: "asc" }],
    });
    return NextResponse.json(agents);
  } catch (err) {
    return handleUnexpected(err);
  }
}
