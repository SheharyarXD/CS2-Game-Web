"use client";

import { motion } from "framer-motion";
import { MatchIcon } from "@/components/ui/MatchIcon";
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/game/config";
import type { MatchState, RarityKey } from "@/lib/game/types";
import { cn } from "@/lib/utils";

/**
 * The rarity cell is tinted with the tier's own in-game colour rather than
 * the red/yellow/green result palette, so a Covert reads red, a Classified
 * reads pink and a Rare Special Item reads as metallic gold. The match
 * result is still carried by the icon and the border, so no information is
 * lost by re-using the cell for colour.
 */
export function RarityCell({
  label,
  rarity,
  state,
  delay = 0,
}: {
  label: string;
  rarity: RarityKey;
  state: MatchState;
  delay?: number;
}) {
  const palette = RARITY_COLORS[rarity];
  const gold = palette.sparkle;

  return (
    <motion.div
      initial={{ rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      style={
        gold
          ? undefined
          : { color: palette.text, backgroundColor: palette.bg, borderColor: palette.border }
      }
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 border-l px-1.5 py-2 text-center",
        gold && "rarity-gold",
      )}
    >
      <span className="relative z-10 text-[9px] font-semibold uppercase tracking-wider opacity-80 sm:hidden">
        {label}
      </span>
      <div className="relative z-10 flex items-center gap-1">
        <MatchIcon state={state} className="h-3 w-3" />
        <span className="text-[11px] font-semibold leading-tight">{RARITY_LABELS[rarity]}</span>
      </div>
    </motion.div>
  );
}
