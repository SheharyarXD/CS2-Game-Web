import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { activateClue } from "@/lib/server/skinGame";
import { clueSchema } from "@/lib/validation";
import { apiError, handleUnexpected } from "@/lib/server/apiError";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = clueSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "A valid clue key is required.");
  }

  try {
    const token = getOrCreateSessionToken();
    const state = await activateClue(params.sessionId, token, parsed.data.clue);
    return NextResponse.json(state);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("not found")) return apiError(404, err.message);
      // Clue still locked, or an unrecognised key: both are the caller's
      // fault and carry a message that is safe to show the player.
      if (err.message.includes("unlocks after") || err.message.includes("Unknown clue")) {
        return apiError(400, err.message);
      }
    }
    return handleUnexpected(err);
  }
}
