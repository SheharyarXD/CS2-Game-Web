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
      <p className="px-4 py-8 text-center text-[12px] text-cs-dim2">
        No guesses yet. Search for a skin above to make your first guess.
      </p>
    );
  }

  return (
    <div>
      <div className="hidden grid-cols-7 border-b border-[#22333d] bg-[#16242c] sm:grid">
        {COLUMN_HEADERS.map((header) => (
          <div
            key={header}
            className={`px-2 py-1.5 text-center font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-cs-dim ${
              header === "Skin" ? "col-span-2 text-left" : ""
            }`}
          >
            {header}
          </div>
        ))}
      </div>

      <ul className="divide-y divide-[#1c2c35]">
        <AnimatePresence initial={false}>
          {[...guesses].reverse().map((guess) => (
            <motion.li
              key={guess.guessOrder}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-7 sm:gap-0 sm:p-0"
            >
              <div className="col-span-2 flex items-center gap-2.5 px-2 py-2">
                <span className="relative h-9 w-12 shrink-0 overflow-hidden border border-[#2c4150] bg-[#0e1922]">
                  <Image
                    src={guess.skin.imageUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain"
                    unoptimized
                    loading="eager"
                  />
                </span>
                <span className="min-w-0 truncate text-[12px] text-white">
                  {guess.skin.weapon} | {guess.skin.name}
                </span>
              </div>
              <ComparisonCell label="Color" value={COLOR_LABELS[guess.skin.color]} state={guess.result.color} delay={0.05} />
              <ComparisonCell label="Wear" value={WEAR_LABELS[guess.skin.wear]} state={guess.result.wear} delay={0.1} />
              <ComparisonCell
                label="Case"
                value={guess.skin.caseOrCollection ?? "None"}
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
