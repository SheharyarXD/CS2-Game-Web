"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { SkinSummary } from "@/lib/server/normalize";

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
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`tactical-panel border-2 p-6 text-center ${won ? "border-state-correct/60" : "border-state-incorrect/60"}`}
    >
      <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
        {won ? "Target Identified" : "Out of Luck"}
      </p>
      <div className="relative mx-auto mt-4 h-32 w-48">
        <Image src={target.imageUrl} alt={target.displayName} fill sizes="192px" className="object-contain" unoptimized />
      </div>
      <h2 className="mt-3 font-display text-2xl font-bold text-neutral-50">
        {target.weapon} | {target.name}
      </h2>
      <p className="mt-2 text-sm text-neutral-400">
        {won ? `Solved in ${guessCount} guess${guessCount === 1 ? "" : "es"}.` : "Better luck next time."}
      </p>

      {mode === "daily" && nextResetAt && <DailyCountdown nextResetAt={nextResetAt} />}

      {mode === "unlimited" && onPlayAgain && (
        <Button className="mt-5" onClick={onPlayAgain}>
          Play Again
        </Button>
      )}
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

  if (now === null) return null; // avoid SSR/client clock mismatch flash

  const diff = Math.max(0, targetMs - now);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <p className="mt-5 font-display text-sm uppercase tracking-wider text-neutral-400">
      Next daily skin in{" "}
      <span className="tabular-nums text-accent-orange">
        {hours}h {minutes}m {seconds}s
      </span>
    </p>
  );
}
