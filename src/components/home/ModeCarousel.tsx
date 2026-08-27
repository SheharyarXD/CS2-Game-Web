"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { gameConfig } from "@/lib/game/config";
import { useT } from "@/lib/i18n/SettingsProvider";
import { cn } from "@/lib/utils";

/**
 * The promo strip from the client's main menu: a row of offer cards with
 * a highlighted lead card, a green call-to-action on each, and the
 * paging dots plus arrows beneath. Here the cards are the game's modes.
 */
interface ModeCard {
  href: string;
  badge: string;
  badgeTone: string;
  title: string;
  body: string;
  cta: string;
  art: React.ReactNode;
}

export function ModeCarousel() {
  const t = useT();
  const [lead, setLead] = useState(0);

  const CARDS: ModeCard[] = useMemo(
    () => [
      {
        href: "/skins/daily",
        badge: t("nav.daily"),
        badgeTone: "bg-[#c0392b]",
        title: t("mode.dailySkin"),
        body: t("mode.dailySkinBody"),
        cta: t("home.playDaily"),
        art: <CaseArt tone="#c8891f" />,
      },
      {
        href: "/skins/unlimited",
        badge: t("nav.unlimited"),
        badgeTone: "bg-[#587f28]",
        title: t("mode.unlimitedSkins"),
        body: t("mode.unlimitedBody"),
        cta: t("mode.startRound"),
        art: <CaseArt tone="#6fa8d4" />,
      },
      {
        href: "/maps",
        // Short badge: the full "11 guesses per round" line overflows the card.
        badge: t("game.guesses", { count: gameConfig.mapMode.maxGuesses }),
        badgeTone: "bg-[#2f6fae]",
        title: t("mode.mapGuess"),
        body: t("mode.mapGuessBody"),
        cta: t("mode.identifyMap"),
        art: <MapArt />,
      },
    ],
    [t],
  );

  // Advance the lead card the way the client's promo strip rotates.
  const cardCount = CARDS.length;
  useEffect(() => {
    const timer = setInterval(() => setLead((i) => (i + 1) % cardCount), 7000);
    return () => clearInterval(timer);
  }, [cardCount]);

  const ordered = [...CARDS.slice(lead), ...CARDS.slice(0, lead)];

  return (
    <div className="bg-[#0f1a21] px-2.5 pb-2 pt-2.5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((card, i) => (
          <ModeCardView key={card.href} card={card} lead={i === 0} />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Previous mode"
          onClick={() => setLead((i) => (i - 1 + CARDS.length) % CARDS.length)}
          className="focus-ring px-1 text-[13px] leading-none text-cs-dim2 transition-colors hover:text-white"
        >
          &#8249;
        </button>
        {CARDS.map((c, i) => (
          <button
            key={c.href}
            type="button"
            aria-label={`Show ${c.title}`}
            aria-current={i === lead}
            onClick={() => setLead(i)}
            className={cn(
              "focus-ring h-[6px] w-[6px] rounded-full transition-colors",
              i === lead ? "bg-cs-amberLt" : "bg-[#3a505c] hover:bg-[#4d697a]",
            )}
          />
        ))}
        <button
          type="button"
          aria-label="Next mode"
          onClick={() => setLead((i) => (i + 1) % CARDS.length)}
          className="focus-ring px-1 text-[13px] leading-none text-cs-dim2 transition-colors hover:text-white"
        >
          &#8250;
        </button>
      </div>
    </div>
  );
}

function ModeCardView({ card, lead }: { card: ModeCard; lead: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden border bg-gradient-to-b from-[#1d2f3a] to-[#152430] transition-colors",
        lead ? "border-[#547187]" : "border-[#2c4150]",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0 z-10 px-1.5 py-[3px] font-display text-[9px] font-bold uppercase tracking-wider text-white",
          card.badgeTone,
        )}
      >
        {card.badge}
      </span>

      <div className="flex items-center justify-center border-b border-[#22333d] bg-[#0e1922] py-2">{card.art}</div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="font-display text-[13px] font-medium uppercase tracking-wide text-white">{card.title}</h3>
        <p className="mt-1 flex-1 text-[11px] leading-snug text-cs-dim">{card.body}</p>
        <Link
          href={card.href}
          className="cs-btn-green focus-ring mt-2.5 inline-flex items-center justify-center px-3 py-[5px] font-display text-[11px] font-semibold uppercase tracking-[0.08em]"
        >
          {card.cta}
        </Link>
      </div>
    </div>
  );
}

function CaseArt({ tone }: { tone: string }) {
  return (
    <svg viewBox="0 0 96 58" className="h-[58px] w-[96px]" aria-hidden>
      <rect x="12" y="16" width="72" height="34" rx="2" fill="#243743" stroke="#3d5666" />
      <rect x="12" y="16" width="72" height="9" fill="#2e4655" />
      <rect x="41" y="12" width="14" height="9" rx="1.5" fill={tone} />
      <rect x="20" y="30" width="56" height="14" rx="1" fill="#16242e" />
      <path d="M24 41 34 33l6 5 8-8 10 11z" fill={tone} opacity="0.65" />
      <circle cx="70" cy="37" r="3" fill={tone} opacity="0.9" />
    </svg>
  );
}

function MapArt() {
  return (
    <svg viewBox="0 0 96 58" className="h-[58px] w-[96px]" aria-hidden>
      <rect x="10" y="8" width="76" height="42" fill="#1f3226" stroke="#3d5666" />
      <g fill="#33502f">
        <rect x="16" y="14" width="22" height="14" />
        <rect x="44" y="12" width="18" height="20" />
        <rect x="66" y="20" width="14" height="22" />
        <rect x="18" y="33" width="26" height="12" />
      </g>
      <circle cx="30" cy="21" r="6" fill="none" stroke="#c8891f" strokeWidth="1.6" />
      <circle cx="72" cy="31" r="6" fill="none" stroke="#2f6fae" strokeWidth="1.6" />
    </svg>
  );
}
