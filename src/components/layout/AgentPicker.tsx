"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/lib/i18n/SettingsProvider";
import { cn } from "@/lib/utils";
import type { PlayerStats } from "./PlayerPanel";

interface AgentOption {
  id: string;
  shortName: string;
  imageUrl: string;
  team: string;
  rarity: string;
}

type TeamFilter = "all" | "Counter-Terrorist" | "Terrorist";

export function AgentPicker({
  currentAgentId,
  onClose,
  onSelected,
}: {
  currentAgentId: string | null;
  onClose: () => void;
  onSelected: (stats: PlayerStats) => void;
}) {
  const t = useT();
  const [agents, setAgents] = useState<AgentOption[] | null>(null);
  const [team, setTeam] = useState<TeamFilter>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visible = useMemo(
    () => (agents ?? []).filter((a) => team === "all" || a.team === team),
    [agents, team],
  );

  async function choose(id: string) {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch("/api/player/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: id }),
      });
      if (!res.ok) throw new Error("Could not save your agent.");
      onSelected((await res.json()) as PlayerStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your agent.");
      setSaving(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("profile.chooseAgent")}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 p-4 pt-12 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div ref={panelRef} className="cs-panel flex max-h-[82vh] w-full max-w-[720px] flex-col">
        <div className="cs-panel-head flex items-center gap-2 px-3 py-[7px]">
          <h2 className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-white">
            {t("profile.chooseAgent")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("settings.close")}
            className="focus-ring ml-auto px-1 text-[15px] leading-none text-cs-dim transition-colors hover:text-white"
          >
            &#10005;
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[#22333d] bg-[#101c23] px-3 py-2">
          <p className="mr-auto text-[11px] text-cs-dim2">{t("profile.agentHint")}</p>
          {(["all", "Counter-Terrorist", "Terrorist"] as TeamFilter[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTeam(k)}
              className={cn(
                "focus-ring border px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-wide transition-colors",
                team === k
                  ? "border-cs-amber bg-[#2a4152] text-cs-amberLt"
                  : "border-[#2c4150] bg-[#16242c] text-cs-dim hover:text-white",
              )}
            >
              {k === "all" ? "All" : k === "Counter-Terrorist" ? "CT" : "T"}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="border-b border-[#7d3b34] bg-[#2a1715] px-3 py-2 text-[12px] text-[#e0968e]">
            {error}
          </p>
        )}

        <div className="scrollbar-thin grid flex-1 grid-cols-3 gap-1.5 overflow-y-auto p-3 sm:grid-cols-5 md:grid-cols-6">
          {agents === null &&
            Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-[148px] animate-pulse bg-[#1d2f3a]" />
            ))}

          {agents !== null && visible.length === 0 && (
            <p className="col-span-full py-8 text-center text-[12px] text-cs-dim2">
              No agents available. Run the agent import to populate them.
            </p>
          )}

          {visible.map((a) => {
            const active = a.id === currentAgentId;
            return (
              <button
                key={a.id}
                type="button"
                disabled={saving !== null}
                onClick={() => choose(a.id)}
                title={a.shortName}
                className={cn(
                  // Explicit height rather than an aspect ratio: the source
                  // portraits vary in proportion and were overflowing the cell.
                  "focus-ring group relative block h-[148px] w-full overflow-hidden border bg-[#0e1922] transition-colors disabled:opacity-60",
                  active ? "border-cs-amber" : "border-[#2c4150] hover:border-[#6f92a8]",
                )}
              >
                <Image
                  src={a.imageUrl}
                  alt={a.shortName}
                  fill
                  sizes="120px"
                  // Anchor to the top so the agent's face stays in frame.
                  className="object-cover object-top"
                  unoptimized
                  loading="lazy"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/75 px-1 py-[2px] text-[8.5px] leading-tight text-white">
                  <span className="block truncate">{a.shortName}</span>
                </span>
                {active && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cs-amber text-[9px] text-[#2b1c05]">
                    &#10003;
                  </span>
                )}
                {saving === a.id && <span className="absolute inset-0 animate-pulse bg-black/50" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
