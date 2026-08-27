"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getLevelProgress, getMedals } from "@/lib/game/playerRank";
import { useT } from "@/lib/i18n/SettingsProvider";
import { cn } from "@/lib/utils";
import { AgentPicker } from "./AgentPicker";

export interface PlayerStats {
  gamesPlayed: number;
  dailyStreak: number;
  daysPlayed: number;
  gamesTowardLevel: number;
  serviceMedals: number[];
  hasCurrentYearMedal: boolean;
  agent: { id: string; shortName: string; imageUrl: string; team: string } | null;
}

const EMPTY: PlayerStats = {
  gamesPlayed: 0,
  dailyStreak: 0,
  daysPlayed: 0,
  gamesTowardLevel: 0,
  serviceMedals: [],
  hasCurrentYearMedal: false,
  agent: null,
};

/**
 * The left column of the main menu: an account strip, the player card
 * (agent portrait, medals, counters, level rail) and a secondary panel
 * beneath it — the same stack the game client shows above its friends list.
 */
export function PlayerPanel() {
  const t = useT();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(() => {
    fetch("/api/player/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {
        /* stats are non-critical chrome; leave the card in its empty state */
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const safe = stats ?? EMPTY;
  const level = getLevelProgress({
    gamesTowardLevel: safe.gamesTowardLevel,
    hasCurrentYearMedal: safe.hasCurrentYearMedal,
  });
  const medals = getMedals(safe);

  return (
    <>
      <aside className="hidden w-[292px] shrink-0 flex-col gap-[6px] lg:flex">
        {/* --- account strip ---------------------------------------------- */}
        <div className="flex items-center gap-2 px-1 pb-0.5 pt-1">
          <ShieldIcon className="h-[18px] w-[18px] text-[#7ba7c9]" />
          <span className="font-display text-[13px] font-medium uppercase tracking-[0.08em] text-cs-text/90">
            {t("profile.title")}
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-cs-dim2">{t("profile.local")}</span>
        </div>

        {/* --- player card ------------------------------------------------ */}
        <div className="cs-panel">
          <div className="flex gap-2.5 p-2.5">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              title={t("profile.changeAgent")}
              className="focus-ring group relative h-[58px] w-[58px] shrink-0 overflow-hidden border border-[#46606e] bg-[#0e181e] transition-colors hover:border-cs-amber"
            >
              {safe.agent ? (
                <Image
                  src={safe.agent.imageUrl}
                  alt={safe.agent.shortName}
                  fill
                  sizes="58px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <OperativeAvatar className="h-full w-full" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/70 py-[1px] text-center text-[8px] uppercase tracking-wide text-cs-amberLt opacity-0 transition-opacity group-hover:opacity-100">
                {t("profile.changeAgent")}
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <span className="truncate font-display text-[15px] font-medium leading-tight text-white">
                  {safe.agent?.shortName ?? t("profile.operative")}
                </span>
                <div className="flex shrink-0 flex-col items-end gap-[3px] pt-0.5">
                  <Counter icon={<FlameIcon className="h-2.5 w-2.5" />} value={safe.dailyStreak} title={t("profile.dayStreak")} />
                  <Counter icon={<CalIcon className="h-2.5 w-2.5" />} value={safe.daysPlayed} title={t("profile.daysPlayed")} />
                  <Counter icon={<TargetIcon className="h-2.5 w-2.5" />} value={safe.gamesPlayed} title={t("profile.gamesPlayed")} />
                </div>
              </div>

              {/* medal row */}
              <div className="mt-2 flex items-center gap-[5px]">
                {medals.map((m) => (
                  <span
                    key={m.key}
                    title={`${m.label}${m.earned ? "" : " (locked)"}`}
                    className={cn(
                      "flex h-[19px] w-[19px] items-center justify-center rounded-full border text-[9px]",
                      m.earned
                        ? "border-[#8f6b18] bg-gradient-to-b from-[#e8c65a] to-[#a87f1c] text-[#3a2b06] shadow-[0_0_6px_rgba(226,178,60,0.45)]"
                        : "border-[#31454f] bg-[#131f26] text-[#3f5560]",
                    )}
                  >
                    <StarIcon className="h-[9px] w-[9px]" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* level rail */}
          <div className="px-2.5 pb-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-cs-text">
                {t("profile.level")} <span className="font-display text-[13px] text-cs-amberLt">{level.level}</span>
              </span>
              <span className="text-[10px] text-cs-dim2">
                {level.atMaxLevel
                  ? t("profile.maxLevel")
                  : t("profile.gamesToLevel", { done: level.gamesIntoLevel, total: level.gamesPerLevel })}
              </span>
            </div>
            <div className="cs-rail mt-1.5 h-[7px] w-full">
              <div className="cs-rail-fill h-full transition-[width] duration-500" style={{ width: `${level.percent}%` }} />
            </div>
          </div>

          {/* service medals */}
          {safe.serviceMedals.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-[#22333d] bg-[#0f1a21] px-2.5 py-2">
              {safe.serviceMedals.map((year) => (
                <span
                  key={year}
                  title={t("profile.serviceMedal", { year })}
                  className="rarity-gold flex items-center gap-1 border px-1.5 py-[3px] font-display text-[10px] font-bold uppercase tracking-wide"
                >
                  <LaurelIcon className="relative z-10 h-3 w-3" />
                  <span className="relative z-10">{year}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* --- secondary panel -------------------------------------------- */}
        <div className="cs-panel flex flex-1 flex-col">
          <div className="flex items-center gap-4 border-b border-[#22333d] px-3 py-2">
            <IconCount icon={<FlameIcon className="h-3.5 w-3.5" />} value={safe.dailyStreak} label={t("profile.streak")} />
            <IconCount icon={<CalIcon className="h-3.5 w-3.5" />} value={safe.daysPlayed} label={t("profile.days")} />
            <IconCount icon={<TargetIcon className="h-3.5 w-3.5" />} value={safe.gamesPlayed} label={t("profile.games")} />
          </div>
          <p className="px-3 pt-2 text-center text-[11px] uppercase tracking-[0.18em] text-cs-dim2">
            {t("profile.modes")}
          </p>

          <div className="space-y-[5px] p-3">
            <ModeRow href="/skins/daily" title={t("mode.dailySkin")} note={t("mode.dailySkinNote")} dot="bg-cs-amberLt" />
            <ModeRow href="/skins/unlimited" title={t("mode.unlimited")} note={t("mode.unlimitedNote")} dot="bg-[#7aa93c]" />
            <ModeRow href="/maps" title={t("mode.mapGuess")} note={t("mode.mapGuessNote")} dot="bg-[#6fa8d4]" />
          </div>

          <div className="mt-auto px-3 pb-3">
            <p className="mb-1.5 text-center text-[10px] uppercase tracking-[0.15em] text-cs-dim2">
              {t("profile.needRules")}
            </p>
            <Link
              href="/how-to-play"
              className="focus-ring flex items-center justify-center gap-1.5 border border-[#3c5666] bg-[#16242c] py-1.5 text-[11px] text-cs-link transition-colors hover:bg-[#1d3039] hover:text-white"
            >
              <BookIcon className="h-3 w-3" />
              {t("nav.howToPlay")}
            </Link>
          </div>
        </div>
      </aside>

      {pickerOpen && (
        <AgentPicker
          currentAgentId={safe.agent?.id ?? null}
          onClose={() => setPickerOpen(false)}
          onSelected={(updated) => {
            setStats(updated);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}

function Counter({ icon, value, title }: { icon: React.ReactNode; value: number; title: string }) {
  return (
    <span title={title} className="flex items-center gap-1 text-[10px] leading-none text-cs-dim">
      <span className="text-cs-dim2">{icon}</span>
      {value}
    </span>
  );
}

function IconCount({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <span className="text-cs-dim2">{icon}</span>
      <span className="text-[12px] text-cs-text">{value}</span>
    </span>
  );
}

function ModeRow({ href, title, note, dot }: { href: string; title: string; note: string; dot: string }) {
  return (
    <Link
      href={href}
      className="focus-ring group flex items-center gap-2.5 border border-transparent bg-[#16242c] px-2.5 py-2 transition-colors hover:border-[#3c5666] hover:bg-[#1d3039]"
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-cs-text group-hover:text-white">{title}</span>
        <span className="block truncate text-[10px] text-cs-dim2">{note}</span>
      </span>
      <span aria-hidden className="text-[12px] text-cs-dim2 transition-transform group-hover:translate-x-0.5">
        &#8250;
      </span>
    </Link>
  );
}

/* ---- icons ------------------------------------------------------------- */

function OperativeAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 58 58" className={className} aria-hidden>
      <rect width="58" height="58" fill="#132029" />
      <circle cx="29" cy="22" r="9.5" fill="#38505d" />
      <path d="M9 56c2.8-11 10.6-16.5 20-16.5S46.2 45 49 56z" fill="#38505d" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="m12 2.5 2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6-4.9-4.6 6.6-.8Z" />
    </svg>
  );
}

function LaurelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3c2 2.6 3 5.6 3 9s-1 6.4-3 9c-2-2.6-3-5.6-3-9s1-6.4 3-9Zm-6 4c1.8.6 3 1.9 3.6 3.7-1.9-.3-3.2-1.5-3.6-3.7Zm12 0c-.4 2.2-1.7 3.4-3.6 3.7C15 8.9 16.2 7.6 18 7ZM5 12.5c1.9.4 3.2 1.6 3.8 3.5-2-.2-3.3-1.3-3.8-3.5Zm14 0c-.5 2.2-1.8 3.3-3.8 3.5.6-1.9 1.9-3.1 3.8-3.5Z" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13 2c.6 3.4-2.4 4.7-2.4 8A3.4 3.4 0 0 0 14 13.4c1.9 0 3-1.4 3-3.1 3.2 4 1 11.7-5 11.7-3.7 0-6.6-2.9-6.6-6.7C5.4 9 11.3 7.6 13 2Z" />
    </svg>
  );
}

function CalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7 2v2H5.5A1.5 1.5 0 0 0 4 5.5V8h16V5.5A1.5 1.5 0 0 0 18.5 4H17V2h-2v2H9V2H7ZM4 10v8.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V10H4Z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4 4h7v16H4V4Zm9 0h7v16h-7V4Z" />
    </svg>
  );
}
