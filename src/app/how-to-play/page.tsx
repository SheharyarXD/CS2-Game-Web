export default function HowToPlayPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent-orange">Guide</p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-neutral-50">
        How to Play
      </h1>

      <section className="tactical-panel mt-8 border border-base-700 p-6">
        <h2 className="font-display text-lg font-semibold text-neutral-50">Skin Guess</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-300">
          <li>Search for and select a CS2 skin to make a guess.</li>
          <li>Each guess is compared against a hidden target across five attributes: color, wear, case, rarity, and knife status.</li>
          <li>
            <span className="font-semibold text-state-correct-fg">Green</span> means an exact match,{" "}
            <span className="font-semibold text-state-partial-fg">yellow</span> means a related/close match, and{" "}
            <span className="font-semibold text-state-incorrect-fg">red</span> means no match.
          </li>
          <li>Use clues (case, rarity, color) if you get stuck. Each can only be revealed once.</li>
          <li>Daily mode has one shared target for everyone that resets every 24 hours (00:00 UTC). Unlimited mode gives you a new random target every game.</li>
        </ul>
      </section>

      <section className="tactical-panel mt-6 border border-base-700 p-6">
        <h2 className="font-display text-lg font-semibold text-neutral-50">Map Guess</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-300">
          <li>Identify the hidden map from the smallest visible section. You start heavily zoomed in.</li>
          <li>Every incorrect guess reveals more of the map.</li>
          <li>You have 11 guesses. Guess correctly to win, or see the full map and the answer once you run out.</li>
        </ul>
      </section>
    </div>
  );
}
