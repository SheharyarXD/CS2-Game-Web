import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-steel-700 bg-steel-900/70 px-5 py-3 sm:px-8">
        <span className="h-2 w-2 rounded-full bg-accent-blue shadow-[0_0_8px_theme(colors.accent.blue)]" />
        <span className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-neutral-200">
          Guessing Game
        </span>
      </div>

      <div className="px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent-blue">
          Daily Challenge
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-neutral-50 sm:text-5xl">
          CS2 Guessing Game
        </h1>
        <p className="mt-4 max-w-xl text-sm text-neutral-400 sm:text-base">
          Identify the hidden Counter-Strike 2 skin or map. One target a day, unlimited practice runs,
          color-coded clues.
        </p>

        <div className="mt-10 grid w-full max-w-4xl gap-5 sm:grid-cols-2">
          <GameCard
            href="/skins"
            tag="Daily"
            tagColor="bg-accent-blue text-steel-950"
            eyebrow="Skin Guess"
            title="Can you identify today's CS2 skin?"
            description="Guess the color, wear, case, rarity, and knife status. Green is exact, yellow is close, red is wrong."
          />
          <GameCard
            href="/maps"
            tag="11 Guesses"
            tagColor="bg-accent-gold text-steel-950"
            eyebrow="Map Guess"
            title="How quickly can you identify the map?"
            description="Start zoomed all the way in. Every wrong guess reveals more of the map, 11 attempts total."
          />
        </div>
      </div>
    </div>
  );
}

function GameCard({
  href,
  tag,
  tagColor,
  eyebrow,
  title,
  description,
}: {
  href: string;
  tag: string;
  tagColor: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="tactical-panel group relative flex flex-col justify-between overflow-hidden border border-steel-700">
      <span
        className={`absolute right-0 top-0 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wide ${tagColor}`}
      >
        {tag}
      </span>
      <div className="p-6">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-neutral-50">{title}</h2>
        <p className="mt-3 text-sm text-neutral-400">{description}</p>
      </div>
      <div className="border-t border-steel-700 p-4">
        <Link
          href={href}
          className="focus-ring inline-flex items-center gap-2 bg-steel-700 px-4 py-2 font-display text-xs font-semibold uppercase tracking-wide text-neutral-100 transition-colors hover:bg-accent-blue hover:text-steel-950"
        >
          Play now
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            &#8594;
          </span>
        </Link>
      </div>
    </div>
  );
}
