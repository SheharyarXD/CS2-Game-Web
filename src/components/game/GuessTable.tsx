"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ComparisonCell } from "./ComparisonCell";
import { RarityCell } from "./RarityCell";
import type { GuessHistoryEntry } from "@/lib/server/skinGame";
import { WEAR_LABELS } from "@/lib/game/config";
import { WEAPON_CATEGORY_LABELS } from "@/lib/game/weaponMatching";
import { useT } from "@/lib/i18n/SettingsProvider";

export function GuessTable({ guesses }: { guesses: GuessHistoryEntry[] }) {
  const t = useT();

  if (guesses.length === 0) {
    return <p className="px-4 py-8 text-center text-[12px] text-cs-dim2">{t("game.noGuesses")}</p>;
  }

  const headers = [
    t("game.colSkin"),
    t("game.colWear"),
    t("game.colCollection"),
    t("game.colRarity"),
    t("game.colWeapon"),
  ];

  return (
    <div>
      <div className="hidden grid-cols-6 border-b border-[#22333d] bg-[#16242c] sm:grid">
        {headers.map((header, i) => (
          <div
            key={header}
            className={`px-2 py-1.5 text-center font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-cs-dim ${
              i === 0 ? "col-span-2 text-left" : ""
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
              className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-6 sm:gap-0 sm:p-0"
            >
              <div className="col-span-2 flex items-center gap-3 px-2 py-2">
                <span className="relative h-[72px] w-[96px] shrink-0 overflow-hidden border border-[#2c4150] bg-[#0e1922]">
                  <Image
                    src={guess.skin.imageUrl}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-contain"
                    unoptimized
                    loading="eager"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[13px] font-medium uppercase tracking-wide text-white">
                    {guess.skin.weapon}
                  </span>
                  <span className="block truncate text-[12px] text-cs-dim">{guess.skin.name}</span>
                </span>
              </div>

              <ComparisonCell
                label={t("game.colWear")}
                value={WEAR_LABELS[guess.skin.wear]}
                state={guess.result.wear}
                delay={0.05}
              />
              <ComparisonCell
                label={t("game.colCollection")}
                value={guess.skin.caseOrCollection ?? t("game.noCollection")}
                state={guess.result.collection}
                delay={0.1}
              />
              <RarityCell
                label={t("game.colRarity")}
                rarity={guess.skin.rarity}
                state={guess.result.rarity}
                delay={0.15}
              />
              <ComparisonCell
                label={t("game.colWeapon")}
                value={WEAPON_CATEGORY_LABELS[guess.skin.weaponCategory]}
                state={guess.result.weaponType}
                delay={0.2}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
