"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/SettingsProvider";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "./SettingsDialog";
import { QuitDialog } from "./QuitDialog";

/**
 * The client's main-menu tab strip: a horizontally centred cluster of a
 * home button, evenly sized section tabs separated by bevelled dividers,
 * and a trailing quit button. The active tab is lit amber.
 *
 * The Skins tab opens a dropdown for the two skin modes rather than
 * taking a whole tab each.
 */
export function TopNav() {
  const pathname = usePathname();
  const t = useT();
  const [skinsOpen, setSkinsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const skinsRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";
  const skinsActive = pathname.startsWith("/skins");
  const mapsActive = pathname === "/maps";
  const howToActive = pathname === "/how-to-play";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (skinsRef.current && !skinsRef.current.contains(e.target as Node)) setSkinsOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close the dropdown once navigation has happened.
  useEffect(() => {
    setSkinsOpen(false);
  }, [pathname]);

  const tabClass = (active: boolean) =>
    cn(
      "cs-tab-divider focus-ring flex h-full flex-1 items-center justify-center gap-1.5 px-2 text-center font-display text-[12px] font-medium uppercase leading-none tracking-[0.14em] transition-colors sm:text-[13px]",
      active
        ? "bg-gradient-to-b from-[#55708a] to-[#3a5064] text-cs-amberLt shadow-[inset_0_-2px_0_0_#c8891f]"
        : "text-cs-text/85 hover:bg-white/8 hover:text-white",
    );

  return (
    <>
      <header className="cs-topbar sticky top-0 z-40 h-10 shrink-0">
        <div className="mx-auto flex h-full w-full max-w-[900px] items-stretch">
          <Link
            href="/"
            aria-label={t("nav.home")}
            aria-current={isHome ? "page" : undefined}
            className={cn(
              "cs-tab-divider focus-ring flex w-11 shrink-0 items-center justify-center transition-colors",
              isHome
                ? "bg-gradient-to-b from-cs-amberLt to-cs-amber text-[#2b1c05]"
                : "text-cs-dim hover:bg-white/8 hover:text-cs-text",
            )}
          >
            <HomeIcon className="h-[18px] w-[18px]" />
          </Link>

          <nav className="flex flex-1 items-stretch">
            {/* Skins: dropdown of the two skin modes */}
            <div ref={skinsRef} className="relative flex flex-1 items-stretch">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={skinsOpen}
                onClick={() => setSkinsOpen((o) => !o)}
                className={cn(tabClass(skinsActive), "w-full")}
              >
                {t("nav.skins")}
                <ChevronIcon className={cn("h-2.5 w-2.5 transition-transform", skinsOpen && "rotate-180")} />
              </button>

              {skinsOpen && (
                <div
                  role="menu"
                  className="cs-panel absolute left-0 top-full z-50 mt-[2px] w-full min-w-[190px] p-1"
                >
                  <DropdownItem
                    href="/skins/daily"
                    active={pathname === "/skins/daily"}
                    title={t("mode.dailySkin")}
                    note={t("mode.dailySkinNote")}
                    dot="bg-cs-amberLt"
                  />
                  <DropdownItem
                    href="/skins/unlimited"
                    active={pathname === "/skins/unlimited"}
                    title={t("mode.unlimited")}
                    note={t("mode.unlimitedNote")}
                    dot="bg-[#7aa93c]"
                  />
                </div>
              )}
            </div>

            <Link href="/maps" aria-current={mapsActive ? "page" : undefined} className={tabClass(mapsActive)}>
              {t("nav.maps")}
            </Link>

            <Link
              href="/how-to-play"
              aria-current={howToActive ? "page" : undefined}
              className={tabClass(howToActive)}
            >
              {t("nav.howToPlay")}
            </Link>

            <button type="button" onClick={() => setSettingsOpen(true)} className={tabClass(settingsOpen)}>
              <GearIcon className="h-[13px] w-[13px]" />
              {t("nav.settings")}
            </button>
          </nav>

          <button
            type="button"
            aria-label={t("nav.quit")}
            onClick={() => setQuitOpen(true)}
            className="cs-tab-divider focus-ring flex w-11 shrink-0 items-center justify-center text-cs-dim transition-colors hover:bg-[#7d3b34]/50 hover:text-[#ff8a7a]"
          >
            <PowerIcon className="h-[17px] w-[17px]" />
          </button>
        </div>
      </header>

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {quitOpen && <QuitDialog onClose={() => setQuitOpen(false)} />}
    </>
  );
}

function DropdownItem({
  href,
  active,
  title,
  note,
  dot,
}: {
  href: string;
  active: boolean;
  title: string;
  note: string;
  dot: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        "focus-ring group flex items-center gap-2.5 px-2.5 py-2 transition-colors",
        active ? "bg-[#2a4152]" : "hover:bg-[#1d3039]",
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-display text-[12px] uppercase tracking-wide text-white">{title}</span>
        <span className="block truncate text-[10px] normal-case tracking-normal text-cs-dim2">{note}</span>
      </span>
    </Link>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3 2.5 11.2h2.8V21h5V15h3.4v6h5v-9.8h2.8L12 3Z" />
    </svg>
  );
}

function PowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3.5v8" />
      <path d="M6.3 6.6a8 8 0 1 0 11.4 0" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Zm0 5.6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
      <path d="m20.6 13.4.1-1.4-.1-1.4 1.8-1.4-1.8-3.1-2.2.7a7.7 7.7 0 0 0-2.4-1.4L15.6 3H8.4l-.4 2.4a7.7 7.7 0 0 0-2.4 1.4l-2.2-.7-1.8 3.1 1.8 1.4-.1 1.4.1 1.4-1.8 1.4 1.8 3.1 2.2-.7c.7.6 1.5 1.1 2.4 1.4l.4 2.4h7.2l.4-2.4c.9-.3 1.7-.8 2.4-1.4l2.2.7 1.8-3.1-1.8-1.4Zm-2.2 3.2-1.7-.5-.7.6c-.6.5-1.2.9-1.9 1.1l-.9.3-.3 1.9h-2.2l-.3-1.9-.9-.3c-.7-.2-1.3-.6-1.9-1.1l-.7-.6-1.7.5-1.1-1.9 1.4-1.1-.1-.9v-1l.1-.9-1.4-1.1 1.1-1.9 1.7.5.7-.6c.6-.5 1.2-.9 1.9-1.1l.9-.3.3-1.9h2.2l.3 1.9.9.3c.7.2 1.3.6 1.9 1.1l.7.6 1.7-.5 1.1 1.9-1.4 1.1.1.9v1l-.1.9 1.4 1.1-1.1 1.9Z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" className={className} aria-hidden>
      <path d="M1.5 3.5 6 8l4.5-4.5H1.5Z" />
    </svg>
  );
}
