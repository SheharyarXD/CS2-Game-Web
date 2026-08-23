import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 sm:py-24">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent-orange">
        Daily Challenge
      </p>
      <h1 className="mt-3 text-center font-display text-4xl font-bold uppercase tracking-tight text-neutral-50 sm:text-6xl">
        CS2 Guessing Game
      </h1>
      <p className="mt-4 max-w-xl text-center text-base text-neutral-400 sm:text-lg">
        Identify the hidden Counter-Strike 2 skin or map. One target a day, unlimited practice runs,
        color-coded clues.
      </p>

      <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <GameCard
          href="/skins"
          eyebrow="Skin Guess"
          title="Can you identify today's CS2 skin?"
          description="Guess the color, wear, case, rarity, and knife status. Green is exact, yellow is close, red is wrong."
          accent="border-accent-orange/50"
        />
        <GameCard
          href="/maps"
          eyebrow="Map Guess"
          title="How quickly can you identify the map?"
          description="Start zoomed all the way in. Every wrong guess reveals more of the map, 11 attempts total."
          accent="border-rarity-restricted/50"
        />
      </div>
    </div>
  );
}

function GameCard({
  href,
  eyebrow,
  title,
  description,
  accent,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`focus-ring tactical-panel group flex flex-col justify-between border-2 p-6 transition-transform hover:-translate-y-0.5 ${accent}`}
    >
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-neutral-50">{title}</h2>
        <p className="mt-3 text-sm text-neutral-400">{description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-accent-orange">
        Play now
        <span aria-hidden className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}
