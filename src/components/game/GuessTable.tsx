"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ComparisonCell } from "./ComparisonCell";
import type { GuessHistoryEntry } from "@/lib/server/skinGame";
import { COLOR_LABELS } from "@/lib/game/colorMatching";
import { RARITY_LABELS, WEAR_LABELS } from "@/lib/game/config";

const COLUMN_HEADERS = ["Skin", "Color", "Wear", "Case", "Rarity", "Knife"];

export function GuessTable({ guesses }: { guesses: GuessHistoryEntry[] }) {
  if (guesses.length === 0) {
    return (
      <div className="tactical-panel border border-dashed border-base-600 px-6 py-10 text-center text-sm text-neutral-500">
        No guesses yet — search for a skin above to make your first guess.
      </div>
    );
  }

  return (
    <div className="tactical-panel border border-base-700">
      <div className="hidden grid-cols-7 divide-x divide-base-700 border-b border-base-700 bg-base-850 sm:grid">
        {COLUMN_HEADERS.map((header) => (
          <div
            key={header}
            className={`px-3 py-2 text-center font-display text-xs font-semibold uppercase tracking-wider text-neutral-400 ${
              header === "Skin" ? "col-span-2" : ""
            }`}
          >
            {header}
          </div>
        ))}
      </div>

      <ul className="divide-y divide-base-700">
        <AnimatePresence initial={false}>
          {[...guesses].reverse().map((guess) => (
            <motion.li
              key={guess.guessOrder}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-7 sm:gap-0 sm:divide-x sm:divide-base-700 sm:p-0"
            >
              <div className="col-span-2 flex items-center gap-3 px-2 py-2 sm:px-3 sm:py-3">
                <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-sm bg-base-950">
                  <Image src={guess.skin.imageUrl} alt="" fill sizes="56px" className="object-contain" unoptimized />
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-neutral-100">
                  {guess.skin.weapon} | {guess.skin.name}
                </span>
              </div>
              <ComparisonCell label="Color" value={COLOR_LABELS[guess.skin.color]} state={guess.result.color} delay={0.05} />
              <ComparisonCell label="Wear" value={WEAR_LABELS[guess.skin.wear]} state={guess.result.wear} delay={0.1} />
              <ComparisonCell
                label="Case"
                value={guess.skin.caseOrCollection ?? "Unknown"}
                state={guess.result.case}
                delay={0.15}
              />
              <ComparisonCell
                label="Rarity"
                value={RARITY_LABELS[guess.skin.rarity]}
                state={guess.result.rarity}
                delay={0.2}
              />
              <ComparisonCell
                label="Knife"
                value={guess.skin.isKnife ? "Knife" : "Not a knife"}
                state={guess.result.knife}
                delay={0.25}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
