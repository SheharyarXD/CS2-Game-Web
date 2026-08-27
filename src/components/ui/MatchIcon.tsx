import type { MatchState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

/**
 * Icons that mirror the colour states so information is never conveyed by
 * colour alone — this is what makes colorblind mode work alongside the
 * palette swap, and what screen readers announce via the label.
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

/**
 * Result cell colours. The actual values live in CSS custom properties so
 * colorblind mode can swap the whole palette in one place — see
 * :root[data-colorblind="on"] in globals.css.
 */
export const MATCH_STATE_CLASSES: Record<MatchState, string> = {
  correct: "state-correct",
  partial: "state-partial",
  incorrect: "state-incorrect",
};
