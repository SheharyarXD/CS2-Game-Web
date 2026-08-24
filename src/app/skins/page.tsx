import Link from "next/link";

export default function SkinModeSelectPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent-orange">Skin Guess</p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-neutral-50">
        Pick a mode
      </h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/skins/daily"
          className="focus-ring tactical-panel border-2 border-accent-blue/50 p-6 text-left transition-transform hover:-translate-y-0.5"
        >
          <h2 className="font-display text-xl font-semibold text-neutral-50">Daily Skin</h2>
          <p className="mt-2 text-sm text-neutral-400">
            One shared target for everyone, every day. Resets at 00:00 UTC.
          </p>
        </Link>
        <Link
          href="/skins/unlimited"
          className="focus-ring tactical-panel border-2 border-base-600 p-6 text-left transition-transform hover:-translate-y-0.5"
        >
          <h2 className="font-display text-xl font-semibold text-neutral-50">Unlimited</h2>
          <p className="mt-2 text-sm text-neutral-400">
            A new random skin every game. Play as many rounds as you want.
          </p>
        </Link>
      </div>
    </div>
  );
}
