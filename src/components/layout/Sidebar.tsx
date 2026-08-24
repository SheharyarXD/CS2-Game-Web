"use client";

import { useEffect, useState } from "react";

interface PlayerStats {
  gamesPlayed: number;
  dailyStreak: number;
  daysPlayed: number;
}

export function Sidebar() {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/player/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-r border-steel-700 bg-gradient-to-b from-steel-900 to-steel-950 lg:flex">
      <div className="border-b border-steel-700 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-accent-blue/30 bg-steel-800">
            <OperatorIcon className="h-8 w-8 text-steel-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-neutral-100">
              Guest Operative
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-accent-gold">
              <ShieldIcon className="h-3 w-3" />
              No account required
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-steel-700 p-5">
        <p className="mb-3 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Player Stats
        </p>
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={<StreakIcon className="h-4 w-4" />} value={stats?.dailyStreak ?? "-"} label="Day Streak" />
          <StatTile icon={<CalendarIcon className="h-4 w-4" />} value={stats?.daysPlayed ?? "-"} label="Days Played" />
          <StatTile icon={<TargetIcon className="h-4 w-4" />} value={stats?.gamesPlayed ?? "-"} label="Games Played" />
        </div>
      </div>

      <div className="p-5">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Modes
        </p>
        <ul className="mt-3 space-y-2 text-xs text-neutral-400">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
            Daily Skin, one target for everyone
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
            Unlimited Skin, play as much as you want
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            Map Guess, 11 guesses per round
          </li>
        </ul>
      </div>
    </aside>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 border border-steel-700 bg-steel-850 py-3 text-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent-gold/40 bg-steel-800 text-accent-gold">
        {icon}
      </span>
      <span className="font-display text-base font-bold text-neutral-100">{value}</span>
      <span className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</span>
    </div>
  );
}

function OperatorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z" />
    </svg>
  );
}

function StreakIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-2.5.5 2-1 3-1 3 .3-2-1-3-1.5-5-.5 2-2.5 3-2.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14a4 4 0 1 0 8 0c0-1.5-1-2.5-1-2.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}
