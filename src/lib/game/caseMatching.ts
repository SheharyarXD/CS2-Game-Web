import type { CaseType, MatchState } from "./types";

/**
 * Case/collection comparison rules.
 *
 * The client specified only an exact/different relationship here (no
 * partial state): a skin's case or collection either matches exactly or it
 * doesn't. `caseType` is compared alongside the name so a case and a
 * collection that happen to share a display string are never conflated.
 */
export function compareCase(
  guess: { caseOrCollection: string | null; caseType: CaseType },
  target: { caseOrCollection: string | null; caseType: CaseType },
): MatchState {
  if (
    guess.caseOrCollection !== null &&
    target.caseOrCollection !== null &&
    guess.caseOrCollection === target.caseOrCollection &&
    guess.caseType === target.caseType
  ) {
    return "correct";
  }
  return "incorrect";
}
