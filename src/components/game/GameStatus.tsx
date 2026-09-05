"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { SkinSummary } from "@/lib/server/normalize";
import { Panel, PanelHead } from "@/components/ui/Panel";
import { DailyCountdown } from "./DailyCountdown";
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
    <motion.div
      // A win is the payoff moment, so the panel arrives with a short
      // scale-in rather than the plain fade used elsewhere.
      initial={{ opacity: 0, y: 8, scale: won ? 0.97 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
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
          <motion.div
            initial={won ? { opacity: 0, scale: 0.9 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="relative h-[152px] w-[248px] shrink-0 border border-[#2c4150] bg-[#0e1922]"
          >
            <Image
              src={target.imageUrl}
              alt={target.displayName}
              fill
              sizes="248px"
              className="object-contain"
              unoptimized
              loading="eager"
            />
          </motion.div>
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
            {mode === "daily" && nextResetAt && (
              <p className="mt-1.5 flex items-center justify-center gap-1.5 font-display text-[11px] uppercase tracking-wide text-cs-dim2 sm:justify-start">
                {t("game.nextDailyIn")}
                <DailyCountdown nextResetAt={nextResetAt} />
              </p>
            )}
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

