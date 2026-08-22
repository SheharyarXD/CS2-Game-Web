import type { MatchState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

/**
 * Icons that mirror the color states so information is never conveyed by
 * color alone (checkmark / tilde / cross read the same to colorblind users
 * and screen readers via the accompanying aria-label).
 */
export function MatchIcon({ state, className }: { state: MatchState; className?: string }) {
  const label = state === "correct" ? "Correct" : state === "partial" ? "Partial match" : "Incorrect";
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 20 20"
      className={cn("h-4 w-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {state === "correct" && <path d="M4 10.5 8 14.5 16 6" />}
      {state === "partial" && <path d="M4 10 Q7 6, 10 10 T16 10" />}
      {state === "incorrect" && <path d="M5 5 15 15 M15 5 5 15" />}
    </svg>
  );
}

export const MATCH_STATE_CLASSES: Record<MatchState, string> = {
  correct: "bg-state-correct/20 text-state-correct-fg border-state-correct/50",
  partial: "bg-state-partial/20 text-state-partial-fg border-state-partial/50",
  incorrect: "bg-state-incorrect/20 text-state-incorrect-fg border-state-incorrect/50",
};
