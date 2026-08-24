import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getPlayerStats } from "@/lib/server/playerStats";
import { handleUnexpected } from "@/lib/server/apiError";

export async function GET() {
  try {
    const token = getOrCreateSessionToken();
    const stats = await getPlayerStats(token);
    return NextResponse.json(stats);
  } catch (err) {
    return handleUnexpected(err);
  }
}
