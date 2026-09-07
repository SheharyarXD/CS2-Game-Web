"use client";

import { useEffect, useState } from "react";
import { easternClock, msUntilNextDailyReset } from "@/lib/game/easternTime";

/**
 * The small monospace readout pinned to the bottom-right corner, in the
 * spirit of the client's net_graph overlay. It reports real values — the
 * current Eastern clock and the time remaining until the daily target
 * rolls over — rather than mock telemetry.
 *
 * Both are in Eastern Time because that is when the daily actually resets;
 * showing a UTC clock beside an Eastern countdown would not add up. The
 * countdown goes through the shared zone helper rather than assuming a
 * 24-hour day, so it stays honest across daylight saving.
 */
export function StatusReadout() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null; // avoid an SSR/client clock mismatch on first paint

  const diff = Math.max(0, msUntilNextDailyReset(now));
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = pad(Math.floor(diff / 3_600_000));
  const m = pad(Math.floor((diff % 3_600_000) / 60_000));
  const s = pad(Math.floor((diff % 60_000) / 1000));

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-1.5 right-2 z-30 hidden text-right font-mono text-[10px] leading-[1.35] text-[#8fd44a]/70 md:block"
    >
      <div>et {easternClock(now)}</div>
      <div>reset in {`${h}:${m}:${s}`}</div>
    </div>
  );
}
