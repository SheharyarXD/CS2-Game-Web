import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { handleUnexpected } from "@/lib/server/apiError";

// Reads from the database, so it must run per request. Left static, Next
// would prerender it at build time and freeze whatever the build machine saw
// (or bake in an error response if the database was unreachable).
export const dynamic = "force-dynamic";

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
