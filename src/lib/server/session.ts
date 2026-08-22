import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "cs2_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Returns the caller's anonymous session token, creating and persisting a
 * new one (httpOnly, opaque, unguessable) on first visit if none exists.
 * This token is only ever used as a lookup key into GameSession rows — it
 * carries no embedded data, so there is nothing for a client to forge that
 * would grant them anything beyond a fresh game of their own.
 */
export function getOrCreateSessionToken(): string {
  const store = cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const token = randomUUID();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return token;
}
