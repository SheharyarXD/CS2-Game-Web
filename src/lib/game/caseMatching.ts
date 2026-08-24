import type { CaseType, MatchState } from "./types";

/**
 * Case/collection comparison rules.
 *
 * The client specified only an exact/different relationship here (no
 * partial state): a skin's case or collection either matches exactly or it
 * doesn't. `caseType` is compared alongside the name so a case and a
 * collection that happen to share a display string are never conflated.
 *
 * A skin with no known case/collection (caseOrCollection: null — in
 * practice this is only M4A4 | Howl, which was pulled from cases and has
 * no clean collection either) still has to satisfy one hard invariant:
 * guessing the exact target skin must always score every attribute as
 * "correct". Excluding null from ever matching would make a null-case
 * skin an unwinnable target the moment it's picked, so two nulls (same
 * caseType) count as a match here, same as any other equal pair.
 */
export function compareCase(
  guess: { caseOrCollection: string | null; caseType: CaseType },
  target: { caseOrCollection: string | null; caseType: CaseType },
): MatchState {
  if (guess.caseOrCollection === target.caseOrCollection && guess.caseType === target.caseType) {
    return "correct";
  }
  return "incorrect";
}
