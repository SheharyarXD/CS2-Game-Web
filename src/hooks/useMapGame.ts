"use client";

import { useCallback, useEffect, useState } from "react";
import type { MapGameStateDTO } from "@/lib/server/mapGameServer";

const STORAGE_KEY = "cs2_map_session";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function useMapGame() {
  const [state, setState] = useState<MapGameStateDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startNewGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<MapGameStateDTO>("/api/game/maps", { method: "POST" });
      localStorage.setItem(STORAGE_KEY, data.sessionId);
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start a new game.");
    } finally {
      setLoading(false);
    }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    const storedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (storedId) {
      try {
        const data = await fetchJson<MapGameStateDTO>(`/api/game/maps/${storedId}`);
        setState(data);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    await startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitGuess = useCallback(
    async (mapId: string) => {
      if (!state || submitting) return;
      setSubmitting(true);
      setError(null);
      try {
        const data = await fetchJson<MapGameStateDTO>(`/api/game/maps/${state.sessionId}/guess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mapId }),
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

  return { state, loading, error, submitting, submitGuess, startNewGame };
}
