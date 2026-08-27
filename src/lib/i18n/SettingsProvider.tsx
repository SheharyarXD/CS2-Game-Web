"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, isSupportedLocale } from "./locales";
import { MESSAGES, type MessageKey } from "./messages";

/**
 * Interface settings (language + colorblind mode).
 *
 * Both are per-viewer preferences with no gameplay effect, so they live in
 * localStorage rather than on the server. The colorblind flag is mirrored
 * onto <html data-colorblind> so the palette can be swapped in plain CSS.
 */

const LOCALE_KEY = "cs2_locale";
const COLORBLIND_KEY = "cs2_colorblind";

interface SettingsValue {
  locale: string;
  setLocale: (code: string) => void;
  colorblind: boolean;
  setColorblind: (on: boolean) => void;
  /** Translate a key, optionally interpolating {placeholders}. */
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [colorblind, setColorblindState] = useState(false);

  // Read stored preferences after mount so the server and first client
  // render agree (both start from the defaults).
  useEffect(() => {
    try {
      const storedLocale = localStorage.getItem(LOCALE_KEY);
      if (storedLocale && isSupportedLocale(storedLocale)) setLocaleState(storedLocale);

      const storedCb = localStorage.getItem(COLORBLIND_KEY);
      if (storedCb === "1") setColorblindState(true);
    } catch {
      // Private browsing or blocked storage: fall back to defaults.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.colorblind = colorblind ? "on" : "off";
  }, [colorblind]);

  const setLocale = useCallback((code: string) => {
    if (!isSupportedLocale(code)) return;
    setLocaleState(code);
    try {
      localStorage.setItem(LOCALE_KEY, code);
    } catch {
      /* preference simply won't persist */
    }
  }, []);

  const setColorblind = useCallback((on: boolean) => {
    setColorblindState(on);
    try {
      localStorage.setItem(COLORBLIND_KEY, on ? "1" : "0");
    } catch {
      /* preference simply won't persist */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const table = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]!;
      return interpolate(table[key], vars);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, colorblind, setColorblind, t }),
    [locale, setLocale, colorblind, setColorblind, t],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside a SettingsProvider");
  return ctx;
}

/** Convenience hook for components that only need the translator. */
export function useT() {
  return useSettings().t;
}
