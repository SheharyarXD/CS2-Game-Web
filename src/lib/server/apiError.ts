import { NextResponse } from "next/server";

/** Consistent JSON error envelope — never leak raw error messages/stacks to clients. */
export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleUnexpected(err: unknown) {
  console.error(err);
  return apiError(500, "Something went wrong. Please try again.");
}
