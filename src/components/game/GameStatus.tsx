"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { SkinSummary } from "@/lib/server/normalize";
import { Panel, PanelHead } from "@/components/ui/Panel";

interface GameStatusProps {
  status: "WON" | "LOST";
  target: SkinSummary;
  guessCount: number;
  mode: "daily" | "unlimited";
  nextResetAt: string | null;
  onPlayAgain?: () => void;
}

export function GameStatus({ status, target, guessCount, mode, nextResetAt, onPlayAgain }: GameStatusProps) {
  const won = status === "WON";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Panel className={won ? "border-[#3f6b33]" : "border-[#7d3b34]"}>
        <PanelHead
          title={won ? "Target Identified" : "Round Over"}
          right={<span className="text-[10px] uppercase tracking-wide">{mode === "daily" ? "Daily" : "Unlimited"}</span>}
        />
        <div className="flex flex-col items-center gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative h-[76px] w-[124px] shrink-0 border border-[#2c4150] bg-[#0e1922]">
            <Image
              src={target.imageUrl}
              alt={target.displayName}
              fill
              sizes="124px"
              className="object-contain"
              unoptimized
              loading="eager"
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-display text-[18px] font-medium uppercase tracking-wide text-white">
              {target.weapon} | {target.name}
            </p>
            <p className="mt-1 text-[12px] text-cs-dim">
              {won
                ? `Solved in ${guessCount} guess${guessCount === 1 ? "" : "es"}.`
                : "Better luck on the next round."}
            </p>
            {mode === "daily" && nextResetAt && <DailyCountdown nextResetAt={nextResetAt} />}
          </div>
          {mode === "unlimited" && onPlayAgain && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="cs-btn-green focus-ring shrink-0 px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em]"
            >
              Play Again
            </button>
          )}
        </div>
      </Panel>
    </motion.div>
  );
}

function DailyCountdown({ nextResetAt }: { nextResetAt: string }) {
  const targetMs = new Date(nextResetAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) return null; // avoid an SSR/client clock mismatch

  const diff = Math.max(0, targetMs - now);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <p className="mt-1.5 font-display text-[11px] uppercase tracking-wide text-cs-dim2">
      Next daily skin in{" "}
      <span className="tabular-nums text-cs-amberLt">
        {hours}h {minutes}m {seconds}s
      </span>
    </p>
  );
}
