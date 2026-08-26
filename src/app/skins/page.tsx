import Link from "next/link";
import { Panel, PanelHead } from "@/components/ui/Panel";

export default function SkinModeSelectPage() {
  return (
    <Panel>
      <PanelHead title="Skin Guess" right={<span className="text-[10px] uppercase tracking-wide">Select a mode</span>} />
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        <ModeCard
          href="/skins/daily"
          title="Daily Skin"
          body="One shared target for every player, rotating at 00:00 UTC. Your progress is kept if you refresh."
          cta="Play Daily"
          accent="border-[#547187]"
        />
        <ModeCard
          href="/skins/unlimited"
          title="Unlimited"
          body="A new random skin every round with no cap on how many you play. Perfect for practice."
          cta="Start Round"
          accent="border-[#2c4150]"
        />
      </div>
    </Panel>
  );
}

function ModeCard({
  href,
  title,
  body,
  cta,
  accent,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  accent: string;
}) {
  return (
    <div className={`flex flex-col border bg-gradient-to-b from-[#1d2f3a] to-[#152430] p-3 ${accent}`}>
      <h3 className="font-display text-[14px] font-medium uppercase tracking-wide text-white">{title}</h3>
      <p className="mt-1.5 flex-1 text-[12px] leading-snug text-cs-dim">{body}</p>
      <Link
        href={href}
        className="cs-btn-green focus-ring mt-3 inline-flex items-center justify-center px-3 py-[6px] font-display text-[11px] font-semibold uppercase tracking-[0.08em]"
      >
        {cta}
      </Link>
    </div>
  );
}
