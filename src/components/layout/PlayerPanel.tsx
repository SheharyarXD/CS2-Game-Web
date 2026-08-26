"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMedals, getRankProgress } from "@/lib/game/playerRank";
import { cn } from "@/lib/utils";

interface PlayerStats {
  gamesPlayed: number;
  dailyStreak: number;
  daysPlayed: number;
}

/**
 * The left column of the main menu: an account strip, the player card
 * (avatar, medals, counters, rank rail) and a secondary panel beneath it —
 * the same stack the game client shows above its friends list.
 */
export function PlayerPanel() {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/player/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {
        /* stats are non-critical chrome; leave the card in its empty state */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const safe: PlayerStats = stats ?? { gamesPlayed: 0, dailyStreak: 0, daysPlayed: 0 };
  const rank = getRankProgress(safe.gamesPlayed);
  const medals = getMedals(safe);

  return (
    <aside className="hidden w-[292px] shrink-0 flex-col gap-[6px] lg:flex">
      {/* --- account strip ------------------------------------------------ */}
      <div className="flex items-center gap-2 px-1 pb-0.5 pt-1">
        <ShieldIcon className="h-[18px] w-[18px] text-[#7ba7c9]" />
        <span className="font-display text-[13px] font-medium uppercase tracking-[0.08em] text-cs-text/90">
          Guest Profile
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-cs-dim2">local</span>
      </div>

      {/* --- player card -------------------------------------------------- */}
      <div className="cs-panel">
        <div className="flex gap-2.5 p-2.5">
          <div className="h-[52px] w-[52px] shrink-0 border border-[#46606e] bg-[#0e181e]">
            <OperativeAvatar className="h-full w-full" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="truncate font-display text-[15px] font-medium leading-tight text-white">
                Operative
              </span>
              <div className="flex shrink-0 flex-col items-end gap-[3px] pt-0.5">
                <Counter icon={<FlameIcon className="h-2.5 w-2.5" />} value={safe.dailyStreak} title="Daily streak" />
                <Counter icon={<CalIcon className="h-2.5 w-2.5" />} value={safe.daysPlayed} title="Days played" />
                <Counter icon={<TargetIcon className="h-2.5 w-2.5" />} value={safe.gamesPlayed} title="Games played" />
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
                      ? "border-cs-amber bg-gradient-to-b from-[#e3b24c] to-[#a8761a] text-[#33230a]"
                      : "border-[#31454f] bg-[#131f26] text-[#3f5560]",
                  )}
                >
                  <StarIcon className="h-[9px] w-[9px]" />
                </span>
              ))}
              <span className="ml-0.5 text-[11px] leading-none text-cs-dim2">&#8250;</span>
            </div>
          </div>
        </div>

        {/* rank rail */}
        <div className="px-2.5 pb-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-cs-text">
              {rank.tierName} <span className="text-cs-dim2">Rank {rank.tierIndex + 1}</span>
            </span>
            <span className="text-[11px] text-cs-dim">
              {rank.nextTierName ?? "Max"}{" "}
              {rank.nextTierName && <span className="text-cs-dim2">Rank {rank.tierIndex + 2}</span>}
            </span>
          </div>
          <div className="cs-rail mt-1.5 h-[7px] w-full">
            <div className="cs-rail-fill h-full transition-[width] duration-500" style={{ width: `${rank.percent}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-cs-dim2">
            {rank.nextTierName
              ? `${rank.gamesIntoTier} / ${rank.gamesNeededForTier} games toward ${rank.nextTierName}`
              : "Highest rank reached"}
          </p>
        </div>

        {/* rank badge strip */}
        <div className="flex items-center gap-2 border-t border-[#22333d] bg-[#0f1a21] px-2.5 py-2">
          <span className="flex h-[22px] w-[34px] items-center justify-center border border-[#3c5666] bg-gradient-to-b from-[#2b4150] to-[#1a2831]">
            <ChevronBadge className="h-3 w-3 text-cs-amberLt" />
          </span>
          <span className="font-display text-[12px] uppercase tracking-wide text-cs-text/90">{rank.tierName}</span>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-cs-dim">
            <TrophyIcon className="h-3 w-3 text-cs-amberLt" />
            {medals.filter((m) => m.earned).length}
          </span>
        </div>
      </div>

      {/* --- secondary panel --------------------------------------------- */}
      <div className="cs-panel flex-1">
        <div className="flex items-center gap-4 border-b border-[#22333d] px-3 py-2">
          <IconCount icon={<FlameIcon className="h-3.5 w-3.5" />} value={safe.dailyStreak} label="Streak" />
          <IconCount icon={<CalIcon className="h-3.5 w-3.5" />} value={safe.daysPlayed} label="Days" />
          <IconCount icon={<TargetIcon className="h-3.5 w-3.5" />} value={safe.gamesPlayed} label="Games" />
        </div>
        <p className="px-3 pt-2 text-center text-[11px] uppercase tracking-[0.18em] text-cs-dim2">Game Modes</p>

        <div className="space-y-[5px] p-3">
          <ModeRow href="/skins/daily" title="Daily Skin" note="One target for everyone" dot="bg-cs-amberLt" />
          <ModeRow href="/skins/unlimited" title="Unlimited" note="Endless random skins" dot="bg-[#7aa93c]" />
          <ModeRow href="/maps" title="Map Guess" note="11 guesses per round" dot="bg-[#6fa8d4]" />
        </div>

        <div className="mt-auto px-3 pb-3">
          <p className="mb-1.5 text-center text-[10px] uppercase tracking-[0.15em] text-cs-dim2">Need the rules?</p>
          <Link
            href="/how-to-play"
            className="focus-ring flex items-center justify-center gap-1.5 border border-[#3c5666] bg-[#16242c] py-1.5 text-[11px] text-cs-link transition-colors hover:bg-[#1d3039] hover:text-white"
          >
            <BookIcon className="h-3 w-3" />
            How to Play
          </Link>
        </div>
      </div>
    </aside>
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
    <svg viewBox="0 0 52 52" className={className} aria-hidden>
      <rect width="52" height="52" fill="#132029" />
      <circle cx="26" cy="20" r="8.5" fill="#38505d" />
      <path d="M8 50c2.5-10 9.5-15 18-15s15.5 5 18 15z" fill="#38505d" />
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

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6 3h12v2h3v3a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 15.7V18h3v3H8v-3h3v-2.3A6 6 0 0 1 7.4 12H7a4 4 0 0 1-4-4V5h3V3Zm0 4H5v1a2 2 0 0 0 1 1.7V7Zm12 0v2.7A2 2 0 0 0 19 8V7h-1Z" />
    </svg>
  );
}

function ChevronBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 4 3 12h4l5-4.6L17 12h4L12 4Zm0 7-9 8h4l5-4.6L17 19h4l-9-8Z" />
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
