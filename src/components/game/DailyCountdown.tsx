"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Live countdown to the next daily reset.
 *
 * Display only: the server decides which skin is today's target, so this
 * clock can never change the game. When it reaches zero it calls
 * `onElapsed` so the page can re-fetch and pick up the new day's target
 * for a player who left the tab open across midnight UTC.
 */
export function DailyCountdown({
  nextResetAt,
  className,
  onElapsed,
}: {
  nextResetAt: string;
  className?: string;
  onElapsed?: () => void;
}) {
  const targetMs = new Date(nextResetAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset the one-shot guard whenever a new reset time arrives.
  useEffect(() => {
    setFired(false);
  }, [nextResetAt]);

  const diff = now === null ? null : Math.max(0, targetMs - now);

  useEffect(() => {
    if (diff === 0 && !fired && onElapsed) {
      setFired(true);
      onElapsed();
    }
  }, [diff, fired, onElapsed]);

  // Render nothing on the server and on the first client paint, so the
  // markup matches and the clock never flashes a stale value.
  if (diff === null) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <span className={cn("font-mono text-[11px] tabular-nums text-cs-amberLt", className)}>
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
