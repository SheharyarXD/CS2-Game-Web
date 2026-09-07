"use client";

import { motion } from "framer-motion";
import { MATCH_STATE_CLASSES, MatchIcon } from "@/components/ui/MatchIcon";
import type { YearComparison } from "@/lib/game/types";
import { cn } from "@/lib/utils";

/**
 * The release-year cell.
 *
 * A miss carries an arrow saying which side of the target the guess fell
 * on: up when the guessed skin is newer, down when it is older. The arrow
 * sits next to the usual match icon rather than replacing it, so the
 * colour-independent signal the rest of the table relies on is still
 * there, and the whole cell carries a spoken label for screen readers.
 */
export function YearCell({
  label,
  year,
  comparison,
  higherLabel,
  lowerLabel,
  unknownLabel,
  delay = 0,
}: {
  label: string;
  year: number | null;
  comparison: YearComparison;
  higherLabel: string;
  lowerLabel: string;
  unknownLabel: string;
  delay?: number;
}) {
  const hint =
    comparison.direction === "up" ? higherLabel : comparison.direction === "down" ? lowerLabel : null;

  return (
    <motion.div
      initial={{ rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 border-l border-[#1c2c35] px-1.5 py-2 text-center",
        MATCH_STATE_CLASSES[comparison.state],
      )}
      title={hint ?? undefined}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70 sm:hidden">{label}</span>
      <div className="flex items-center gap-1">
        <MatchIcon state={comparison.state} className="h-3 w-3" />
        <span className="text-[11px] font-medium leading-tight tabular-nums">{year ?? unknownLabel}</span>
        {comparison.direction && <DirectionArrow direction={comparison.direction} label={hint ?? ""} />}
      </div>
    </motion.div>
  );
}

function DirectionArrow({ direction, label }: { direction: "up" | "down"; label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0"
      fill="currentColor"
      aria-hidden={label ? undefined : true}
    >
      {direction === "up" ? <path d="M6 1.5 11 9H1L6 1.5Z" /> : <path d="M6 10.5 1 3h10L6 10.5Z" />}
    </svg>
  );
}
