import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { getSkinSessionState } from "@/lib/server/skinGame";
import { apiError } from "@/lib/server/apiError";

export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const token = getOrCreateSessionToken();
    const state = await getSkinSessionState(params.sessionId, token);
    return NextResponse.json(state);
  } catch {
    return apiError(404, "Game session not found.");
  }
}
