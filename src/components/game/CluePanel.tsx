"use client";

import { AnimatePresence, motion } from "framer-motion";
import { COLOR_LABELS, COLOR_SWATCHES, RARITY_LABELS } from "@/lib/game/config";
import type { ClueState } from "@/lib/server/skinGame";
import type { ClueKey, ColorKey, RarityKey } from "@/lib/game/types";
import { useT } from "@/lib/i18n/SettingsProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const CLUE_TITLE_KEYS: Record<ClueKey, MessageKey> = {
  collection: "game.clueCollection",
  rarity: "game.clueRarity",
  color: "game.clueColor",
};

/**
 * Clue values arrive as raw stored keys (a rarity key, a colour key) and
 * are turned into display text here. The collection clue is already a
 * human-readable name.
 */
function formatClueValue(key: ClueKey, value: string): string {
  if (key === "rarity") return RARITY_LABELS[value as RarityKey] ?? value;
  if (key === "color") return COLOR_LABELS[value as ColorKey] ?? value;
  return value;
}

export function CluePanel({
  clues,
  onReveal,
  disabled,
  guessCount,
}: {
  clues: ClueState[];
  onReveal: (key: ClueKey) => void;
  disabled?: boolean;
  guessCount: number;
}) {
  const t = useT();

  return (
    <div className="p-3">
      <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-cs-dim2">
        {t("game.clues")}
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {clues.map((clue) => (
          <ClueTile
            key={clue.key}
            clue={clue}
            guessCount={guessCount}
            disabled={disabled}
            onReveal={onReveal}
            title={t(CLUE_TITLE_KEYS[clue.key])}
            revealLabel={t("game.reveal")}
            hiddenLabel={t("game.hidden")}
            lockedLabel={t("game.clueLocked", { count: clue.unlocksAfter })}
          />
        ))}
      </div>
    </div>
  );
}

function ClueTile({
  clue,
  guessCount,
  disabled,
  onReveal,
  title,
  revealLabel,
  hiddenLabel,
  lockedLabel,
}: {
  clue: ClueState;
  guessCount: number;
  disabled?: boolean;
  onReveal: (key: ClueKey) => void;
  title: string;
  revealLabel: string;
  hiddenLabel: string;
  lockedLabel: string;
}) {
  const locked = !clue.unlocked;
  const remaining = Math.max(0, clue.unlocksAfter - guessCount);

  return (
    <motion.div
      // A clue becoming available is a small reward: pulse the tile once
      // as it unlocks so the change is noticed without being noisy.
      animate={
        clue.unlocked && !clue.revealed
          ? { borderColor: ["#2c4150", "#c8891f", "#2c4150"] }
          : {}
      }
      transition={{ duration: 1.6, repeat: clue.unlocked && !clue.revealed ? Infinity : 0, repeatDelay: 1.4 }}
      className={cn(
        "flex items-center justify-between gap-2 border px-2.5 py-2",
        clue.revealed
          ? "border-cs-amber/60 bg-[#241f11]"
          : locked
            ? "border-[#22333d] bg-[#111c22]"
            : "border-[#2c4150] bg-[#16242c]",
      )}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.12em] text-cs-dim2">
          {locked ? <LockIcon className="h-2.5 w-2.5" /> : <UnlockIcon className="h-2.5 w-2.5" />}
          {title}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={clue.revealed ? "revealed" : locked ? "locked" : "ready"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-1.5"
          >
            {clue.revealed && clue.key === "color" && clue.value && (
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 border border-black/50"
                style={{ background: COLOR_SWATCHES[clue.value as ColorKey] ?? "transparent" }}
              />
            )}
            <p
              className={cn(
                "truncate text-[12px]",
                clue.revealed ? "text-cs-amberLt" : locked ? "text-cs-dim2" : "text-white",
              )}
            >
              {clue.revealed && clue.value
                ? formatClueValue(clue.key, clue.value)
                : locked
                  ? lockedLabel
                  : hiddenLabel}
            </p>
          </motion.div>
        </AnimatePresence>

        {locked && remaining > 0 && (
          <div className="mt-1 h-[3px] w-full bg-[#0b141a]" aria-hidden>
            <div
              className="h-full bg-[#3c5666] transition-[width] duration-500"
              style={{ width: `${Math.round((guessCount / clue.unlocksAfter) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {!clue.revealed &&
        (locked ? (
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-cs-dim2" />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onReveal(clue.key)}
            className="cs-btn-steel focus-ring shrink-0 px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
          >
            {revealLabel}
          </button>
        ))}
    </motion.div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a5 5 0 0 0-5 5v3H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-1V7a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v3H9V7Z" />
    </svg>
  );
}

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a5 5 0 0 0-5 5h2a3 3 0 1 1 6 0v3H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-1V7a5 5 0 0 0-5-5Z" />
    </svg>
  );
}
