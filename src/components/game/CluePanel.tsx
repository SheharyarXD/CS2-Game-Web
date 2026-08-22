"use client";

import { COLOR_LABELS } from "@/lib/game/colorMatching";
import { RARITY_LABELS } from "@/lib/game/config";
import type { ClueState } from "@/lib/server/skinGame";
import { Button } from "@/components/ui/Button";

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
    <div className="tactical-panel border border-base-700 p-4">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-neutral-400">Clues</h3>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {clues.map((clue) => (
          <div key={clue.key} className="flex items-center justify-between gap-2 border border-base-700 bg-base-900 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">{CLUE_TITLES[clue.key]}</p>
              <p className="truncate text-sm text-neutral-100">
                {clue.revealed && clue.value ? formatClueValue(clue.key, clue.value) : "Hidden"}
              </p>
            </div>
            {!clue.revealed && (
              <Button
                variant="secondary"
                className="shrink-0 px-2 py-1.5 text-xs"
                disabled={disabled}
                onClick={() => onReveal(clue.key)}
              >
                Reveal
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
