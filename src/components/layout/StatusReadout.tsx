"use client";

import { useEffect, useState } from "react";

/**
 * The small monospace readout pinned to the bottom-right corner, in the
 * spirit of the client's net_graph overlay. It reports real values — the
 * current UTC clock and the time remaining until the daily target rolls
 * over — rather than mock telemetry.
 */
export function StatusReadout() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null; // avoid an SSR/client clock mismatch on first paint

  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  const diff = Math.max(0, next.getTime() - now.getTime());
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = pad(Math.floor(diff / 3_600_000));
  const m = pad(Math.floor((diff % 3_600_000) / 60_000));
  const s = pad(Math.floor((diff % 60_000) / 1000));
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-1.5 right-2 z-30 hidden text-right font-mono text-[10px] leading-[1.35] text-[#8fd44a]/70 md:block"
    >
      <div>utc {utc}</div>
      <div>reset in {`${h}:${m}:${s}`}</div>
    </div>
  );
}
