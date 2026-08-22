import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { toSkinSummary } from "@/lib/server/normalize";
import { searchQuerySchema } from "@/lib/validation";
import { apiError, handleUnexpected } from "@/lib/server/apiError";

const MAX_RESULTS = 20;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const parsed = searchQuerySchema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json([]);
  }

  try {
    const skins = await prisma.skin.findMany({
      where: {
        active: true,
        searchText: { contains: parsed.data.q.toLowerCase() },
      },
      orderBy: [{ popularity: "desc" }, { displayName: "asc" }],
      take: MAX_RESULTS,
    });

    return NextResponse.json(skins.map(toSkinSummary));
  } catch (err) {
    return handleUnexpected(err);
  }
}
