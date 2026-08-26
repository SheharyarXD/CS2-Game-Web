"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMapGame } from "@/hooks/useMapGame";
import { MapReveal } from "./MapReveal";
import { MapSelector } from "./MapSelector";
import { MatchIcon } from "@/components/ui/MatchIcon";
import { gameConfig } from "@/lib/game/config";
import { Panel, PanelHead } from "@/components/ui/Panel";

export function MapGame() {
  const { state, loading, error, submitting, submitGuess, startNewGame } = useMapGame();

  if (loading && !state) {
    return (
      <Panel>
        <PanelHead title="Map Guess" />
        <div className="animate-pulse p-3">
          <div className="aspect-[4/3] w-full bg-[#1d2f3a]" />
        </div>
      </Panel>
    );
  }

  if (!state) {
    return (
      <Panel>
        <PanelHead title="Map Guess" />
        <p role="alert" className="px-4 py-10 text-center text-[12.5px] text-cs-dim">
          {error ?? "Unable to load the game."}
        </p>
      </Panel>
    );
  }

  const isOver = state.status !== "IN_PROGRESS";
  const guessedIds = state.guesses.map((g) => g.mapId);

  return (
    <div className="flex flex-col gap-[6px]">
      <Panel>
        <PanelHead
          title="Map Guess"
          right={
            <span className="text-[10px] uppercase tracking-wide">
              Guess {Math.min(state.guesses.length + (isOver ? 0 : 1), gameConfig.mapMode.maxGuesses)} /{" "}
              {gameConfig.mapMode.maxGuesses}
            </span>
          }
        />

        <div className="p-3">
          {/* Cap the viewport so the map selector stays on screen alongside it. */}
          <div className="mx-auto w-full max-w-[440px]">
            <MapReveal
              imageUrl={state.imageUrl}
              revealPercent={state.revealPercent}
              focalX={state.focalX}
              focalY={state.focalY}
            />
          </div>

          <div className="mx-auto mt-2 flex w-full max-w-[440px] items-center gap-2">
            <div className="cs-rail h-[7px] flex-1">
              <div
                className="cs-rail-fill h-full transition-[width] duration-500"
                style={{ width: `${state.revealPercent}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10px] text-cs-dim">
              {state.guessesRemaining} left
            </span>
          </div>
        </div>
      </Panel>

      {error && (
        <p role="alert" className="cs-panel border-[#7d3b34] bg-[#2a1715] px-3 py-2 text-[12px] text-[#e0968e]">
          {error}
        </p>
      )}

      {isOver && state.target ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Panel className={state.status === "WON" ? "border-[#3f6b33]" : "border-[#7d3b34]"}>
            <PanelHead title={state.status === "WON" ? "Map Identified" : "Out of Guesses"} />
            <div className="flex flex-col items-center gap-3 p-4 sm:flex-row">
              <div className="relative h-[84px] w-[112px] shrink-0 overflow-hidden border border-[#2c4150]">
                <Image src={state.target.imageUrl} alt={state.target.name} fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="font-display text-[18px] font-medium uppercase tracking-wide text-white">
                  {state.target.name}
                </p>
                <p className="mt-1 text-[12px] text-cs-dim">
                  {state.status === "WON"
                    ? `Solved in ${state.guesses.length} guess${state.guesses.length === 1 ? "" : "es"}.`
                    : "Better luck on the next map."}
                </p>
              </div>
              <button
                type="button"
                onClick={startNewGame}
                className="cs-btn-green focus-ring shrink-0 px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em]"
              >
                Play Again
              </button>
            </div>
          </Panel>
        </motion.div>
      ) : (
        <Panel>
          <PanelHead title="Select a Map" />
          <div className="p-3">
            <MapSelector onSelect={submitGuess} disabled={submitting} guessedIds={guessedIds} />
          </div>
        </Panel>
      )}

      {state.guesses.length > 0 && (
        <Panel>
          <PanelHead title="Guess History" />
          <ul className="divide-y divide-[#1c2c35]">
            {[...state.guesses].reverse().map((guess) => (
              <li
                key={guess.guessOrder}
                className={`flex items-center gap-2 px-3 py-1.5 text-[12px] ${
                  guess.correct ? "bg-[#1e3520] text-[#a5d98c]" : "text-cs-dim"
                }`}
              >
                <MatchIcon state={guess.correct ? "correct" : "incorrect"} className="h-3 w-3" />
                <span className="font-mono text-[10px] text-cs-dim2">#{guess.guessOrder}</span>
                <span>{guess.mapName}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
