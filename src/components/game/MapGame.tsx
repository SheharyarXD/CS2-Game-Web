"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMapGame } from "@/hooks/useMapGame";
import { MapReveal } from "./MapReveal";
import { MapSelector } from "./MapSelector";
import { Button } from "@/components/ui/Button";
import { MatchIcon } from "@/components/ui/MatchIcon";
import { gameConfig } from "@/lib/game/config";

export function MapGame() {
  const { state, loading, error, submitting, submitGuess, startNewGame } = useMapGame();

  if (loading && !state) {
    return <MapGameSkeleton />;
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-neutral-400">
        {error ?? "Unable to load game."}
      </div>
    );
  }

  const isOver = state.status !== "IN_PROGRESS";
  const guessedIds = state.guesses.map((g) => g.mapId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-6 text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent-orange">Map Guess</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-neutral-50">
          Identify the Map
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Guess {state.guesses.length + (isOver ? 0 : 1)} of {gameConfig.mapMode.maxGuesses}
          {" · "}
          {state.guessesRemaining} remaining
        </p>
      </header>

      <MapReveal
        imageUrl={state.imageUrl}
        revealPercent={state.revealPercent}
        focalX={state.focalX}
        focalY={state.focalY}
      />

      {error && (
        <p role="alert" className="mt-4 border border-state-incorrect/50 bg-state-incorrect/10 px-3 py-2 text-sm text-state-incorrect-fg">
          {error}
        </p>
      )}

      {isOver && state.target ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`tactical-panel mt-6 border-2 p-6 text-center ${
            state.status === "WON" ? "border-state-correct/60" : "border-state-incorrect/60"
          }`}
        >
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
            {state.status === "WON" ? "Map Identified" : "Out of Guesses"}
          </p>
          <div className="relative mx-auto mt-4 h-40 w-full max-w-sm overflow-hidden rounded-sm">
            <Image src={state.target.imageUrl} alt={state.target.name} fill className="object-cover" unoptimized />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-neutral-50">{state.target.name}</h2>
          <p className="mt-2 text-sm text-neutral-400">
            {state.status === "WON"
              ? `Solved in ${state.guesses.length} guess${state.guesses.length === 1 ? "" : "es"}.`
              : "Better luck on the next map."}
          </p>
          <Button className="mt-5" onClick={startNewGame}>
            Play Again
          </Button>
        </motion.div>
      ) : (
        <div className="mt-6">
          <MapSelector onSelect={submitGuess} disabled={submitting} guessedIds={guessedIds} />
        </div>
      )}

      {state.guesses.length > 0 && (
        <ul className="mt-6 space-y-1.5">
          {[...state.guesses].reverse().map((guess) => (
            <li
              key={guess.guessOrder}
              className={`flex items-center gap-2 border px-3 py-2 text-sm ${
                guess.correct
                  ? "border-state-correct/50 bg-state-correct/10 text-state-correct-fg"
                  : "border-state-incorrect/50 bg-state-incorrect/10 text-state-incorrect-fg"
              }`}
            >
              <MatchIcon state={guess.correct ? "correct" : "incorrect"} />
              <span className="font-medium">#{guess.guessOrder}</span>
              <span>{guess.mapName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MapGameSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse px-4 py-14">
      <div className="mx-auto h-4 w-32 bg-base-800" />
      <div className="mx-auto mt-3 h-8 w-64 bg-base-800" />
      <div className="mt-8 aspect-square w-full bg-base-800" />
      <div className="mt-6 h-24 w-full bg-base-800" />
    </div>
  );
}
