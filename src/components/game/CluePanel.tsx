"use client";

import { COLOR_LABELS } from "@/lib/game/colorMatching";
import { RARITY_LABELS } from "@/lib/game/config";
import type { ClueState } from "@/lib/server/skinGame";

const CLUE_TITLES: Record<string, string> = {
  case: "Case / Collection",
  rarity: "Rarity",
  color: "Color",
};

function formatClueValue(key: string, value: string): string {
  if (key === "rarity") return RARITY_LABELS[value as keyof typeof RARITY_LABELS] ?? value;
  if (key === "color") return COLOR_LABELS[value as keyof typeof COLOR_LABELS] ?? value;
  return value;
}

export function CluePanel({
  clues,
  onReveal,
  disabled,
}: {
  clues: ClueState[];
  onReveal: (key: ClueState["key"]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="p-3">
      <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-cs-dim2">
        Clues
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {clues.map((clue) => (
          <div
            key={clue.key}
            className="flex items-center justify-between gap-2 border border-[#2c4150] bg-[#16242c] px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="text-[9.5px] uppercase tracking-[0.12em] text-cs-dim2">{CLUE_TITLES[clue.key]}</p>
              <p className="truncate text-[12px] text-white">
                {clue.revealed && clue.value ? formatClueValue(clue.key, clue.value) : "Hidden"}
              </p>
            </div>
            {!clue.revealed && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onReveal(clue.key)}
                className="cs-btn-steel focus-ring shrink-0 px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reveal
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
