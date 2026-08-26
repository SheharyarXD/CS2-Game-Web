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
        "flex flex-col items-center justify-center gap-0.5 border-l border-[#1c2c35] px-1.5 py-2 text-center",
        MATCH_STATE_CLASSES[state],
      )}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70 sm:hidden">{label}</span>
      <div className="flex items-center gap-1">
        <MatchIcon state={state} className="h-3 w-3" />
        <span className="text-[11px] font-medium leading-tight">{value}</span>
      </div>
    </motion.div>
  );
}
