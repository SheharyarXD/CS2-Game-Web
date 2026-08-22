import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { submitMapGuess } from "@/lib/server/mapGameServer";
import { mapGuessSchema } from "@/lib/validation";
import { apiError, handleUnexpected } from "@/lib/server/apiError";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = mapGuessSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "A valid mapId is required.");
  }

  try {
    const token = getOrCreateSessionToken();
    const state = await submitMapGuess(params.sessionId, token, parsed.data.mapId);
    return NextResponse.json(state);
  } catch (err) {
    if (err instanceof Error && (err.message.includes("not found") || err.message.includes("Unknown"))) {
      return apiError(404, err.message);
    }
    return handleUnexpected(err);
  }
}
