"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The client's main-menu tab strip: a horizontally centred cluster of a
 * home button, evenly sized section tabs separated by bevelled dividers,
 * and a trailing quit button. The active tab is lit amber.
 */
const TABS = [
  { href: "/skins/daily", label: "Daily", match: ["/skins/daily"] },
  { href: "/skins/unlimited", label: "Unlimited", match: ["/skins/unlimited"] },
  { href: "/maps", label: "Maps", match: ["/maps"] },
  { href: "/skins", label: "Modes", match: ["/skins"] },
  { href: "/how-to-play", label: "How to Play", match: ["/how-to-play"] },
];

export function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="cs-topbar sticky top-0 z-40 h-10 shrink-0">
      {/* The tab cluster is a fixed-width group centred in the bar, rather
          than stretching edge to edge, matching the client's menu. */}
      <div className="mx-auto flex h-full w-full max-w-[860px] items-stretch">
        <Link
          href="/"
          aria-label="Home"
          aria-current={isHome ? "page" : undefined}
          className={cn(
            "cs-tab-divider focus-ring flex w-11 shrink-0 items-center justify-center transition-colors",
            isHome
              ? "bg-gradient-to-b from-cs-amberLt to-cs-amber text-[#2b1c05]"
              : "text-cs-dim hover:bg-white/5 hover:text-cs-text",
          )}
        >
          <HomeIcon className="h-[18px] w-[18px]" />
        </Link>

        <nav className="flex flex-1 items-stretch">
          {TABS.map((tab) => {
            const active = tab.match.some((m) => pathname === m);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "cs-tab-divider focus-ring flex flex-1 items-center justify-center px-2 text-center font-display text-[12px] font-medium uppercase leading-none tracking-[0.14em] transition-colors sm:text-[13px]",
                  active
                    ? "bg-gradient-to-b from-[#4d6273] to-[#354856] text-cs-amberLt shadow-[inset_0_-2px_0_0_#c8891f]"
                    : "text-cs-text/85 hover:bg-white/5 hover:text-white",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          aria-label="Leave the current game"
          className="cs-tab-divider focus-ring flex w-11 shrink-0 items-center justify-center text-cs-dim transition-colors hover:bg-white/5 hover:text-[#d96a5a]"
        >
          <PowerIcon className="h-[17px] w-[17px]" />
        </Link>
      </div>
    </header>
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
