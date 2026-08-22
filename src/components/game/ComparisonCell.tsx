"use client";

import { motion } from "framer-motion";
import { MATCH_STATE_CLASSES, MatchIcon } from "@/components/ui/MatchIcon";
import type { MatchState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface ComparisonCellProps {
  label: string;
  value: string;
  state: MatchState | "correct" | "incorrect";
  delay?: number;
}

export function ComparisonCell({ label, value, state, delay = 0 }: ComparisonCellProps) {
  return (
    <motion.div
      initial={{ rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "flex flex-col items-center justify-center gap-1 border px-2 py-3 text-center",
        MATCH_STATE_CLASSES[state],
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70 sm:hidden">{label}</span>
      <div className="flex items-center gap-1.5">
        <MatchIcon state={state} />
        <span className="text-xs font-medium sm:text-sm">{value}</span>
      </div>
    </motion.div>
  );
}
