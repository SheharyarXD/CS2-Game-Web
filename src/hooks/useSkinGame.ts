"use client";

import { useCallback, useEffect, useState } from "react";
import type { SkinGameStateDTO } from "@/lib/server/skinGame";
import type { ClueKey } from "@/lib/game/types";

const UNLIMITED_STORAGE_KEY = "cs2_unlimited_skin_session";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export type SkinGameMode = "daily" | "unlimited";

export function useSkinGame(mode: SkinGameMode) {
  const [state, setState] = useState<SkinGameStateDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "daily") {
        const data = await fetchJson<SkinGameStateDTO>("/api/game/skins/daily");
        setState(data);
        return;
      }

      const storedId = typeof window !== "undefined" ? localStorage.getItem(UNLIMITED_STORAGE_KEY) : null;
      if (storedId) {
        try {
          const data = await fetchJson<SkinGameStateDTO>(`/api/game/skins/${storedId}`);
          setState(data);
          return;
        } catch {
          localStorage.removeItem(UNLIMITED_STORAGE_KEY);
        }
      }

      const data = await fetchJson<SkinGameStateDTO>("/api/game/skins/unlimited", { method: "POST" });
      localStorage.setItem(UNLIMITED_STORAGE_KEY, data.sessionId);
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game.");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    init();
  }, [init]);

  const submitGuess = useCallback(
    async (skinId: string) => {
      if (!state || submitting) return;
      setSubmitting(true);
      setError(null);
      try {
        const data = await fetchJson<SkinGameStateDTO>(`/api/game/skins/${state.sessionId}/guess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skinId }),
        });
        setState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit guess.");
      } finally {
        setSubmitting(false);
      }
    },
    [state, submitting],
  );

  const activateClue = useCallback(
    async (clue: ClueKey) => {
      if (!state) return;
      setError(null);
      try {
        const data = await fetchJson<SkinGameStateDTO>(`/api/game/skins/${state.sessionId}/clue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clue }),
        });
        setState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reveal clue.");
      }
    },
    [state],
  );

  const startNewGame = useCallback(async () => {
    if (mode !== "unlimited") return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<SkinGameStateDTO>("/api/game/skins/unlimited", { method: "POST" });
      localStorage.setItem(UNLIMITED_STORAGE_KEY, data.sessionId);
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start a new game.");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  return { state, loading, error, submitting, submitGuess, activateClue, startNewGame };
}
