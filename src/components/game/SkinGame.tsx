"use client";

import { useSkinGame, type SkinGameMode } from "@/hooks/useSkinGame";
import { GuessComposer } from "./GuessComposer";
import { GuessTable } from "./GuessTable";
import { CluePanel } from "./CluePanel";
import { GameStatus } from "./GameStatus";
import { DailyCountdown } from "./DailyCountdown";
import { Panel, PanelHead } from "@/components/ui/Panel";
import { useT } from "@/lib/i18n/SettingsProvider";

export function SkinGame({ mode }: { mode: SkinGameMode }) {
  const { state, loading, error, submitting, submitGuess, activateClue, startNewGame, refresh } =
    useSkinGame(mode);
  const t = useT();
  const title = mode === "daily" ? t("mode.dailySkin") : t("mode.unlimitedSkins");

  if (loading && !state) {
    return <SkinGameSkeleton title={title} />;
  }

  if (!state) {
    return (
      <Panel>
        <PanelHead title={title} />
        <p role="alert" className="px-4 py-10 text-center text-[12.5px] text-cs-dim">
          {error ?? t("game.loadError")}
        </p>
      </Panel>
    );
  }

  const isOver = state.status !== "IN_PROGRESS";
  const guessedIds = state.guesses.map((g) => g.skin.id);
  const count = state.guesses.length;
  const countLabel = count === 1 ? t("game.guessOne") : t("game.guesses", { count });

  return (
    <div className="flex flex-col gap-[6px]">
      <Panel>
        <PanelHead
          title={title}
          right={
            <span className="flex items-center gap-2.5">
              {state.dateKey && (
                <span className="font-mono text-[10px] text-cs-dim2">{state.dateKey}</span>
              )}
              <span className="text-[10px] uppercase tracking-wide">{countLabel}</span>
            </span>
          }
        />

        {/* Daily mode keeps the reset clock visible for the whole round,
            not just on the completion panel. */}
        {mode === "daily" && state.nextResetAt && (
          <div className="flex items-center gap-2 border-b border-[#22333d] bg-[#101c23] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cs-amberLt" />
            <span className="font-display text-[10px] uppercase tracking-[0.16em] text-cs-dim2">
              {t("game.nextDailyIn")}
            </span>
            <DailyCountdown nextResetAt={state.nextResetAt} className="ml-auto" onElapsed={refresh} />
          </div>
        )}

        <div className="border-b border-[#22333d] bg-[#101c23] px-3 py-2.5">
          {isOver ? (
            <p className="text-[12px] text-cs-dim">
              {t("game.roundComplete")} {mode === "daily" ? t("game.newSkinAt") : t("game.startAnother")}
            </p>
          ) : (
            <GuessComposer onSubmit={submitGuess} submitting={submitting} guessedIds={guessedIds} />
          )}
        </div>

        <CluePanel clues={state.clues} onReveal={activateClue} disabled={isOver} guessCount={count} />
      </Panel>

      {error && (
        <p role="alert" className="cs-panel border-[#7d3b34] bg-[#2a1715] px-3 py-2 text-[12px] text-[#e0968e]">
          {error}
        </p>
      )}

      {isOver && state.target && (
        <GameStatus
          status={state.status as "WON" | "LOST"}
          target={state.target}
          guessCount={count}
          mode={mode}
          nextResetAt={state.nextResetAt}
          onPlayAgain={mode === "unlimited" ? startNewGame : undefined}
        />
      )}

      <Panel>
        <PanelHead title={t("game.guessHistory")} />
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
        <div className="animate-pulse p-3">
          <div className="h-24 w-full bg-[#1d2f3a]" />
        </div>
      </Panel>
    </div>
  );
}
