"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/SettingsProvider";

/**
 * The large content block beneath the promo strip, laid out like the
 * client's news panel: a hero banner with the wordmark, a row of section
 * tabs, an article-style body on the left and a rail of shortcut buttons
 * plus a featured card on the right.
 */
export function HomeHero({ skinCount, mapCount }: { skinCount: number; mapCount: number }) {
  const t = useT();

  return (
    <div>
      {/* hero banner */}
      <div className="relative flex h-[178px] items-center justify-center overflow-hidden border-b border-[#22333d] bg-gradient-to-b from-[#4e6879] to-[#22333f] sm:h-[210px]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #ffffff 0 1px, transparent 1px 46px), repeating-linear-gradient(65deg, #ffffff 0 1px, transparent 1px 62px)",
          }}
        />
        <div className="relative text-center">
          <p className="font-display text-[34px] font-bold uppercase leading-none tracking-[0.06em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] sm:text-[46px]">
            CS2 <span className="text-cs-amberLt">Guess</span>
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.3em] text-cs-text/85">Skins &amp; Maps</p>
        </div>
      </div>

      {/* section tabs */}
      <div className="flex items-center gap-5 border-b border-[#22333d] bg-[#132029] px-3 py-[7px]">
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-cs-amberLt">
          {t("home.briefing")}
        </span>
        <Link
          href="/how-to-play"
          className="focus-ring font-display text-[11px] uppercase tracking-[0.14em] text-cs-dim transition-colors hover:text-white"
        >
          {t("home.rules")}
        </Link>
        <Link
          href="/maps"
          className="focus-ring font-display text-[11px] uppercase tracking-[0.14em] text-cs-dim transition-colors hover:text-white"
        >
          {t("nav.maps")}
        </Link>
      </div>

      {/* body */}
      <div className="grid gap-4 p-3.5 lg:grid-cols-[1fr_236px]">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-[22px] font-medium uppercase tracking-wide text-white">
              {t("home.identifySkin")}
            </h3>
            {skinCount > 0 && (
              <div className="hidden shrink-0 text-right sm:block">
                <p className="font-display text-[20px] font-bold leading-none text-white">
                  {skinCount.toLocaleString()}
                </p>
                <p className="text-[9px] uppercase tracking-[0.14em] text-cs-dim2">{t("home.skinsInRotation")}</p>
              </div>
            )}
          </div>

          <p className="mt-2.5 text-[12.5px] leading-relaxed text-cs-text/90">{t("home.intro")}</p>

          <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
            <Legend tone="state-correct" label={t("home.greenLabel")} note={t("home.greenNote")} />
            <Legend tone="state-partial" label={t("home.yellowLabel")} note={t("home.yellowNote")} />
            <Legend tone="state-incorrect" label={t("home.redLabel")} note={t("home.redNote")} />
          </div>

          <ul className="mt-3 space-y-1 text-[12px] text-cs-dim">
            <li>&#8226; {t("home.bullet1")}</li>
            <li>&#8226; {t("home.bullet2")}</li>
            <li>&#8226; {t("home.bullet3")}</li>
          </ul>
        </div>

        {/* right rail */}
        <div className="space-y-2">
          <RailButton href="/skins/daily" title={t("mode.dailySkin")} note={t("mode.dailySkinNote")} />
          <RailButton href="/skins/unlimited" title={t("mode.unlimited")} note={t("mode.unlimitedNote")} />
          <RailButton href="/maps" title={t("mode.mapGuess")} note={t("mode.mapGuessNote")} />

          <div className="relative mt-1 overflow-hidden border border-[#2c4150] bg-[#0e1922]">
            <div className="flex h-[74px] items-center justify-center bg-gradient-to-b from-[#3c5240] to-[#1c2a20]">
              <svg viewBox="0 0 120 60" className="h-[60px] w-[120px]" aria-hidden>
                <rect x="8" y="6" width="104" height="48" fill="#233a26" />
                <g fill="#38562f">
                  <rect x="14" y="12" width="30" height="18" />
                  <rect x="52" y="10" width="24" height="26" />
                  <rect x="82" y="18" width="22" height="28" />
                  <rect x="16" y="36" width="32" height="14" />
                </g>
                <circle cx="30" cy="21" r="7" fill="none" stroke="#c8891f" strokeWidth="2" />
                <circle cx="92" cy="30" r="7" fill="none" stroke="#2f6fae" strokeWidth="2" />
              </svg>
            </div>
            <div className="px-2.5 py-2">
              <p className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-white">
                {mapCount > 0 ? t("home.maps", { count: mapCount }) : t("nav.maps")}
              </p>
              <p className="mt-0.5 text-[10.5px] text-cs-dim2">{t("home.mapsNote")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ tone, label, note }: { tone: string; label: string; note: string }) {
  return (
    <div className={`flex items-center gap-2 border px-2 py-1.5 ${tone}`}>
      <span className="h-2.5 w-2.5 shrink-0 border border-current" />
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      <span className="ml-auto text-[10px] opacity-80">{note}</span>
    </div>
  );
}

function RailButton({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Link href={href} className="cs-btn-steel focus-ring group flex items-center gap-2.5 px-2.5 py-2 transition-colors">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#4a6577] bg-[#16242c]">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-cs-amberLt" aria-hidden>
          <path d="M6 3.5 20 12 6 20.5V3.5Z" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-[12px] uppercase tracking-wide text-white">{title}</span>
        <span className="block truncate text-[10px] text-cs-dim2">{note}</span>
      </span>
    </Link>
  );
}
