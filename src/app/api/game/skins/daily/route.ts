import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getOrStartDailySession } from "@/lib/server/skinGame";
import { handleUnexpected } from "@/lib/server/apiError";

export async function GET() {
  try {
    const token = getOrCreateSessionToken();
    const state = await getOrStartDailySession(token);
    return NextResponse.json(state);
  } catch (err) {
    return handleUnexpected(err);
  }
}
