"use client";

import { useSkinGame, type SkinGameMode } from "@/hooks/useSkinGame";
import { SkinSearch } from "./SkinSearch";
import { GuessTable } from "./GuessTable";
import { CluePanel } from "./CluePanel";
import { GameStatus } from "./GameStatus";

export function SkinGame({ mode }: { mode: SkinGameMode }) {
  const { state, loading, error, submitting, submitGuess, activateClue, startNewGame } = useSkinGame(mode);

  if (loading && !state) {
    return <SkinGameSkeleton />;
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-neutral-400">
        {error ?? "Unable to load game."}
      </div>
    );
  }

  const isOver = state.status !== "IN_PROGRESS";
  const guessedIds = state.guesses.map((g) => g.skin.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-6 text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent-orange">
          {mode === "daily" ? "Daily Skin" : "Unlimited"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-neutral-50">
          Guess the CS2 Skin
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          {state.guesses.length} guess{state.guesses.length === 1 ? "" : "es"} so far
        </p>
      </header>

      {!isOver && (
        <div className="mb-6">
          <SkinSearch
            disabled={submitting}
            excludeIds={guessedIds}
            onSelect={(skin) => submitGuess(skin.id)}
          />
        </div>
      )}

      <div className="mb-6">
        <CluePanel clues={state.clues} onReveal={activateClue} disabled={isOver} />
      </div>

      {error && (
        <p role="alert" className="mb-4 border border-state-incorrect/50 bg-state-incorrect/10 px-3 py-2 text-sm text-state-incorrect-fg">
          {error}
        </p>
      )}

      {isOver && state.target && (
        <div className="mb-6">
          <GameStatus
            status={state.status as "WON" | "LOST"}
            target={state.target}
            guessCount={state.guesses.length}
            mode={mode}
            nextResetAt={state.nextResetAt}
            onPlayAgain={mode === "unlimited" ? startNewGame : undefined}
          />
        </div>
      )}

      <GuessTable guesses={state.guesses} />
    </div>
  );
}

function SkinGameSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-14">
      <div className="mx-auto h-4 w-32 bg-base-800" />
      <div className="mx-auto mt-3 h-8 w-64 bg-base-800" />
      <div className="mt-8 h-12 w-full bg-base-800" />
      <div className="mt-6 h-24 w-full bg-base-800" />
      <div className="mt-6 h-40 w-full bg-base-800" />
    </div>
  );
}
