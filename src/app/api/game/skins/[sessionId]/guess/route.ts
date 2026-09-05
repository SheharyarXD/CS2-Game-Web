import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { DuplicateGuessError, submitSkinGuess } from "@/lib/server/skinGame";
import { skinGuessSchema } from "@/lib/validation";
import { apiError, handleUnexpected } from "@/lib/server/apiError";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = skinGuessSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "A valid skinId is required.");
  }

  try {
    const token = getOrCreateSessionToken();
    const state = await submitSkinGuess(params.sessionId, token, parsed.data.skinId);
    return NextResponse.json(state);
  } catch (err) {
    // A repeat guess is the player's mistake, not a failure: return a
    // message the UI can show verbatim and leave the history untouched.
    if (err instanceof DuplicateGuessError) {
      return apiError(409, err.message);
    }
    if (err instanceof Error && (err.message.includes("not found") || err.message.includes("Unknown"))) {
      return apiError(404, err.message);
    }
    return handleUnexpected(err);
  }
}
