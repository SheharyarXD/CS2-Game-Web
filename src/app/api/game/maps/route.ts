import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { startMapSession } from "@/lib/server/mapGameServer";
import { handleUnexpected } from "@/lib/server/apiError";

export async function POST() {
  try {
    const token = getOrCreateSessionToken();
    const state = await startMapSession(token);
    return NextResponse.json(state);
  } catch (err) {
    return handleUnexpected(err);
  }
}
