import { NextResponse } from "next/server";
import { getOrCreateSessionToken } from "@/lib/server/session";
import { setPlayerAgent } from "@/lib/server/playerStats";
import { agentSchema } from "@/lib/validation";
import { apiError, handleUnexpected } from "@/lib/server/apiError";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = agentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "A valid agentId is required.");
  }

  try {
    const token = getOrCreateSessionToken();
    const stats = await setPlayerAgent(token, parsed.data.agentId);
    return NextResponse.json(stats);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unknown agent")) {
      return apiError(404, err.message);
    }
    return handleUnexpected(err);
  }
}
