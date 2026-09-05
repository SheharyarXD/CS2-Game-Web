"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { SkinSearch } from "./SkinSearch";
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/game/config";
import type { SkinSummary } from "@/lib/server/normalize";
import { useT } from "@/lib/i18n/SettingsProvider";

/**
 * Two-step guess entry: pick a skin from the search, review it, then
 * submit. The preview gives the player a chance to catch a mis-click
 * before spending a guess, and gives the submit button somewhere to live
 * so it can be disabled while the request is in flight.
 */
export function GuessComposer({
  onSubmit,
  submitting,
  guessedIds,
}: {
  onSubmit: (skinId: string) => void;
  submitting: boolean;
  guessedIds: string[];
}) {
  const t = useT();
  const [selected, setSelected] = useState<SkinSummary | null>(null);

  function submit() {
    if (!selected || submitting) return;
    onSubmit(selected.id);
    setSelected(null);
  }

  return (
    <div>
      <SkinSearch disabled={submitting} excludeIds={guessedIds} onSelect={setSelected} />

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 flex items-center gap-3 border border-[#3c5666] bg-[#16242c] p-2"
        >
          <span className="relative h-[54px] w-[72px] shrink-0 overflow-hidden border border-[#2c4150] bg-[#0e1922]">
            <Image
              src={selected.imageUrl}
              alt=""
              fill
              sizes="72px"
              className="object-contain"
              unoptimized
              loading="eager"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[13px] font-medium uppercase tracking-wide text-white">
              {selected.weapon}
            </span>
            <span className="block truncate text-[12px] text-cs-dim">{selected.name}</span>
            <span
              className="block truncate text-[10px]"
              style={{ color: RARITY_COLORS[selected.rarity].text }}
            >
              {RARITY_LABELS[selected.rarity]}
            </span>
          </span>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelected(null)}
              disabled={submitting}
              className="cs-btn-steel focus-ring px-2.5 py-[6px] font-display text-[10px] font-semibold uppercase tracking-wide disabled:opacity-40"
            >
              {t("game.clear")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="cs-btn-green focus-ring px-3.5 py-[6px] font-display text-[11px] font-semibold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t("game.submitting") : t("game.submitGuess")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
