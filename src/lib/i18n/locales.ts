/**
 * Supported interface languages.
 *
 * Every locale listed here is fully translated in messages.ts — the
 * selector deliberately only offers languages the interface actually
 * speaks, rather than listing options that silently fall back to English.
 * To add one, add the entry here and a matching block in messages.ts.
 *
 * Flags are drawn as inline SVG (components/ui/FlagIcon.tsx) rather than
 * emoji: Windows ships no flag glyphs, so regional-indicator emoji would
 * appear as bare letter pairs there.
 */
export interface LocaleMeta {
  code: string;
  /** Language name written in that language. */
  label: string;
  /** English name, shown as a secondary line for findability. */
  englishLabel: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: "en", label: "English", englishLabel: "English" },
  { code: "es", label: "Español", englishLabel: "Spanish" },
  { code: "pt-BR", label: "Português (Brasil)", englishLabel: "Portuguese (Brazil)" },
  { code: "fr", label: "Français", englishLabel: "French" },
  { code: "de", label: "Deutsch", englishLabel: "German" },
  { code: "it", label: "Italiano", englishLabel: "Italian" },
  { code: "pl", label: "Polski", englishLabel: "Polish" },
  { code: "ru", label: "Русский", englishLabel: "Russian" },
  { code: "tr", label: "Türkçe", englishLabel: "Turkish" },
  { code: "zh-CN", label: "简体中文", englishLabel: "Simplified Chinese" },
  { code: "ja", label: "日本語", englishLabel: "Japanese" },
  { code: "ko", label: "한국어", englishLabel: "Korean" },
];

export const DEFAULT_LOCALE = "en";

export function isSupportedLocale(code: string): boolean {
  return LOCALES.some((l) => l.code === code);
}
