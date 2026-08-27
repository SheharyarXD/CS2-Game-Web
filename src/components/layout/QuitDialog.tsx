"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/SettingsProvider";

/**
 * Quit confirmation for the power button.
 *
 * Browsers only honour window.close() for windows that script opened, so
 * closing an ordinary tab the user navigated to is blocked. We attempt the
 * close, then detect that the page is still here and fall back to telling
 * the player they can close the tab, rather than appearing to do nothing.
 */
export function QuitDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [blocked, setBlocked] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function attemptQuit() {
    window.close();
    // If the tab was not script-opened the call is ignored and we are
    // still running a moment later.
    window.setTimeout(() => setBlocked(true), 200);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("nav.quit")}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 p-4 pt-24 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div ref={panelRef} className="cs-panel w-full max-w-[400px]">
        <div className="cs-panel-head px-3 py-[7px]">
          <h2 className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-white">
            {t("nav.quit")}
          </h2>
        </div>

        <div className="p-4">
          {blocked ? (
            <p className="text-[12.5px] leading-relaxed text-cs-text">
              Your browser will not let a page close a tab it did not open. You can close this tab yourself with
              Ctrl+W, or Cmd+W on a Mac.
            </p>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-cs-text">Leave the game and close this tab?</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cs-btn-steel focus-ring px-3.5 py-[6px] font-display text-[11px] font-semibold uppercase tracking-[0.08em]"
            >
              {t("settings.close")}
            </button>
            {!blocked && (
              <button
                type="button"
                onClick={attemptQuit}
                className="focus-ring bg-gradient-to-b from-[#a8493e] to-[#7d3b34] px-3.5 py-[6px] font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_2px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:from-[#bd554a] hover:to-[#8f453d]"
              >
                {t("nav.quit")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
