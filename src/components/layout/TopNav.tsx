"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/skins", label: "Skin Guess" },
  { href: "/maps", label: "Map Guess" },
  { href: "/how-to-play", label: "How to Play" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-steel-700 bg-gradient-to-b from-steel-850 to-steel-900 shadow-[0_1px_0_0_rgba(103,193,245,0.08)]">
      <div className="flex h-full items-stretch">
        <Link
          href="/"
          aria-label="Home"
          className="focus-ring flex w-14 shrink-0 items-center justify-center border-r border-steel-700 text-neutral-300 transition-colors hover:bg-steel-800 hover:text-accent-blue"
        >
          <HomeIcon className="h-5 w-5" />
        </Link>

        <nav className="flex items-stretch divide-x divide-steel-700">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "focus-ring flex items-center px-5 font-display text-xs font-semibold uppercase tracking-[0.15em] transition-colors sm:px-7 sm:text-sm",
                  active
                    ? "bg-steel-800 text-accent-blue shadow-[inset_0_-2px_0_0_theme(colors.accent.blue)]"
                    : "text-neutral-400 hover:bg-steel-800/60 hover:text-neutral-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center pr-5">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Guess<span className="text-accent-blue">.CS</span>
          </span>
        </div>
      </div>
    </header>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
