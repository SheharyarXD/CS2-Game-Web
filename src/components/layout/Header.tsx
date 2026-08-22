import Link from "next/link";

const NAV_LINKS = [
  { href: "/skins", label: "Skin Guess" },
  { href: "/maps", label: "Map Guess" },
  { href: "/how-to-play", label: "How to Play" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-base-700 bg-base-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-sm">
          <span className="flex h-8 w-8 items-center justify-center border border-accent-orange/60 bg-base-900 font-display text-sm font-bold text-accent-orange">
            C2
          </span>
          <span className="font-display text-lg font-semibold uppercase tracking-wide text-neutral-100">
            Guess<span className="text-accent-orange">.cs</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-sm px-2 py-2 font-display text-xs font-medium uppercase tracking-wider text-neutral-400 transition-colors hover:bg-base-800 hover:text-neutral-100 sm:px-3 sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
