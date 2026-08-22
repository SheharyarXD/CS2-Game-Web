import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { startUnlimitedSession } from "@/lib/server/skinGame";
import { handleUnexpected } from "@/lib/server/apiError";

export async function POST() {
  try {
    const token = getOrCreateSessionToken();
    const state = await startUnlimitedSession(token);
    return NextResponse.json(state);
  } catch (err) {
    return handleUnexpected(err);
  }
}
