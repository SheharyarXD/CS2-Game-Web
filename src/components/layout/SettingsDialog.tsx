"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/lib/i18n/SettingsProvider";
import { LOCALES } from "@/lib/i18n/locales";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { cn } from "@/lib/utils";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { locale, setLocale, colorblind, setColorblind, t } = useSettings();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.title")}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 p-4 pt-16 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div ref={panelRef} className="cs-panel w-full max-w-[560px]">
        <div className="cs-panel-head flex items-center gap-2 px-3 py-[7px]">
          <h2 className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-white">
            {t("settings.title")}
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

        {/* Display */}
        <div className="border-b border-[#22333d] p-3.5">
          <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-cs-amberLt">
            {t("settings.display")}
          </p>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12.5px] text-white">{t("settings.colorblind")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-cs-dim2">{t("settings.colorblindNote")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={colorblind}
              onClick={() => setColorblind(!colorblind)}
              className={cn(
                "focus-ring relative h-[24px] w-[48px] shrink-0 border transition-colors",
                colorblind ? "border-[#3f6b33] bg-[#2c5230]" : "border-[#3c5666] bg-[#16242c]",
              )}
            >
              <span
                className={cn(
                  "absolute top-[2px] h-[18px] w-[20px] bg-gradient-to-b transition-all",
                  colorblind
                    ? "left-[26px] from-[#9bcd50] to-[#6d9a2f]"
                    : "left-[2px] from-[#5b7182] to-[#33485a]",
                )}
              />
              <span className="sr-only">{colorblind ? t("settings.on") : t("settings.off")}</span>
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="p-3.5">
          <p className="mb-1 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-cs-amberLt">
            {t("settings.language")}
          </p>
          <p className="mb-2.5 text-[11px] leading-snug text-cs-dim2">{t("settings.languageNote")}</p>

          <div className="scrollbar-thin grid max-h-[260px] grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
            {LOCALES.map((l) => {
              const active = l.code === locale;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code)}
                  aria-current={active}
                  className={cn(
                    "focus-ring flex items-center gap-2.5 border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-cs-amber bg-[#2a4152]"
                      : "border-[#2c4150] bg-[#16242c] hover:border-[#4a6577] hover:bg-[#1d3039]",
                  )}
                >
                  <FlagIcon code={l.code} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-white">{l.label}</span>
                    <span className="block truncate text-[10px] text-cs-dim2">{l.englishLabel}</span>
                  </span>
                  {active && <CheckIcon className="h-3 w-3 shrink-0 text-cs-amberLt" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" className={className} aria-hidden>
      <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
