"use client";

import { RARITY_LABELS, WEAR_LABELS } from "@/lib/game/config";
import type { ClueState } from "@/lib/server/skinGame";
import type { ClueKey, RarityKey, WearKey } from "@/lib/game/types";
import { useT } from "@/lib/i18n/SettingsProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const CLUE_TITLE_KEYS: Record<ClueKey, MessageKey> = {
  wear: "game.clueWear",
  rarity: "game.clueRarity",
  collection: "game.clueCollection",
};

function formatClueValue(key: ClueKey, value: string): string {
  if (key === "rarity") return RARITY_LABELS[value as RarityKey] ?? value;
  if (key === "wear") return WEAR_LABELS[value as WearKey] ?? value;
  return value;
}

export function CluePanel({
  clues,
  onReveal,
  disabled,
}: {
  clues: ClueState[];
  onReveal: (key: ClueKey) => void;
  disabled?: boolean;
}) {
  const t = useT();

  return (
    <div className="p-3">
      <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-cs-dim2">
        {t("game.clues")}
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {clues.map((clue) => {
          const locked = !clue.unlocked;
          return (
            <div
              key={clue.key}
              className={cn(
                "flex items-center justify-between gap-2 border px-2.5 py-2 transition-colors",
                clue.revealed
                  ? "border-cs-amber/60 bg-[#241f11]"
                  : locked
                    ? "border-[#22333d] bg-[#111c22]"
                    : "border-[#2c4150] bg-[#16242c]",
              )}
            >
              <div className="min-w-0">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-cs-dim2">
                  {t(CLUE_TITLE_KEYS[clue.key])}
                </p>
                <p
                  className={cn(
                    "truncate text-[12px]",
                    clue.revealed ? "text-cs-amberLt" : locked ? "text-cs-dim2" : "text-white",
                  )}
                >
                  {clue.revealed && clue.value
                    ? formatClueValue(clue.key, clue.value)
                    : locked
                      ? t("game.clueLocked", { count: clue.unlocksAfter })
                      : t("game.hidden")}
                </p>
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
                    {t("game.reveal")}
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a5 5 0 0 0-5 5v3H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-1V7a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v3H9V7Z" />
    </svg>
  );
}
