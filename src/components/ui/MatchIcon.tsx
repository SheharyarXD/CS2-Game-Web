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
  correct: "bg-[#1e3520] text-[#a5d98c] border-[#3f6b33]",
  partial: "bg-[#31301a] text-[#e3cf76] border-[#7d6f24]",
  incorrect: "bg-[#301a19] text-[#e0968e] border-[#7d3b34]",
};
