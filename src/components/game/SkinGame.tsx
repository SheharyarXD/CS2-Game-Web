"use client";

import { useSkinGame, type SkinGameMode } from "@/hooks/useSkinGame";
import { SkinSearch } from "./SkinSearch";
import { GuessTable } from "./GuessTable";
import { CluePanel } from "./CluePanel";
import { GameStatus } from "./GameStatus";
import { Panel, PanelHead } from "@/components/ui/Panel";

export function SkinGame({ mode }: { mode: SkinGameMode }) {
  const { state, loading, error, submitting, submitGuess, activateClue, startNewGame } = useSkinGame(mode);
  const title = mode === "daily" ? "Daily Skin" : "Unlimited Skins";

  if (loading && !state) {
    return <SkinGameSkeleton title={title} />;
  }

  if (!state) {
    return (
      <Panel>
        <PanelHead title={title} />
        <p role="alert" className="px-4 py-10 text-center text-[12.5px] text-cs-dim">
          {error ?? "Unable to load the game."}
        </p>
      </Panel>
    );
  }

  const isOver = state.status !== "IN_PROGRESS";
  const guessedIds = state.guesses.map((g) => g.skin.id);

  return (
    <div className="flex flex-col gap-[6px]">
      <Panel>
        <PanelHead
          title={title}
          right={
            <span className="text-[10px] uppercase tracking-wide">
              {state.guesses.length} guess{state.guesses.length === 1 ? "" : "es"}
            </span>
          }
        />

        <div className="border-b border-[#22333d] bg-[#101c23] px-3 py-2.5">
          {isOver ? (
            <p className="text-[12px] text-cs-dim">
              This round is complete. {mode === "daily" ? "A new skin unlocks at 00:00 UTC." : "Start another round below."}
            </p>
          ) : (
            <SkinSearch disabled={submitting} excludeIds={guessedIds} onSelect={(skin) => submitGuess(skin.id)} />
          )}
        </div>

        <CluePanel clues={state.clues} onReveal={activateClue} disabled={isOver} />
      </Panel>

      {error && (
        <p
          role="alert"
          className="cs-panel border-[#7d3b34] bg-[#2a1715] px-3 py-2 text-[12px] text-[#e0968e]"
        >
          {error}
        </p>
      )}

      {isOver && state.target && (
        <GameStatus
          status={state.status as "WON" | "LOST"}
          target={state.target}
          guessCount={state.guesses.length}
          mode={mode}
          nextResetAt={state.nextResetAt}
          onPlayAgain={mode === "unlimited" ? startNewGame : undefined}
        />
      )}

      <Panel>
        <PanelHead title="Guess History" />
        <GuessTable guesses={state.guesses} />
      </Panel>
    </div>
  );
}

function SkinGameSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <Panel>
        <PanelHead title={title} />
        <div className="animate-pulse space-y-2 p-3">
          <div className="h-9 w-full bg-[#1d2f3a]" />
          <div className="h-16 w-full bg-[#1d2f3a]" />
        </div>
      </Panel>
      <Panel>
        <PanelHead title="Guess History" />
        <div className="animate-pulse p-3">
          <div className="h-24 w-full bg-[#1d2f3a]" />
        </div>
      </Panel>
    </div>
  );
}
