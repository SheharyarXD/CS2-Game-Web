"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { SkinSummary } from "@/lib/server/normalize";
import { Panel, PanelHead } from "@/components/ui/Panel";
import { useT } from "@/lib/i18n/SettingsProvider";

interface GameStatusProps {
  status: "WON" | "LOST";
  target: SkinSummary;
  guessCount: number;
  mode: "daily" | "unlimited";
  nextResetAt: string | null;
  onPlayAgain?: () => void;
}

export function GameStatus({ status, target, guessCount, mode, nextResetAt, onPlayAgain }: GameStatusProps) {
  const t = useT();
  const won = status === "WON";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Panel className={won ? "border-[#3f6b33]" : "border-[#7d3b34]"}>
        <PanelHead
          title={won ? t("game.targetIdentified") : t("game.roundOver")}
          right={
            <span className="text-[10px] uppercase tracking-wide">
              {mode === "daily" ? t("nav.daily") : t("nav.unlimited")}
            </span>
          }
        />
        <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative h-[152px] w-[248px] shrink-0 border border-[#2c4150] bg-[#0e1922]">
            <Image
              src={target.imageUrl}
              alt={target.displayName}
              fill
              sizes="248px"
              className="object-contain"
              unoptimized
              loading="eager"
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-display text-[20px] font-medium uppercase tracking-wide text-white">
              {target.weapon}
            </p>
            <p className="text-[15px] text-cs-text">{target.name}</p>
            <p className="mt-1.5 text-[12px] text-cs-dim">
              {won
                ? guessCount === 1
                  ? t("game.solvedInOne")
                  : t("game.solvedIn", { count: guessCount })
                : t("game.betterLuck")}
            </p>
            {mode === "daily" && nextResetAt && <DailyCountdown nextResetAt={nextResetAt} label={t("game.nextDailyIn")} />}
          </div>
          {mode === "unlimited" && onPlayAgain && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="cs-btn-green focus-ring shrink-0 px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em]"
            >
              {t("game.playAgain")}
            </button>
          )}
        </div>
      </Panel>
    </motion.div>
  );
}

function DailyCountdown({ nextResetAt, label }: { nextResetAt: string; label: string }) {
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
      {label}{" "}
      <span className="tabular-nums text-cs-amberLt">
        {hours}h {minutes}m {seconds}s
      </span>
    </p>
  );
}
