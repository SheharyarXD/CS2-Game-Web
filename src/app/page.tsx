import Link from "next/link";
import { Panel, PanelHead } from "@/components/ui/Panel";
import { HomeHero } from "@/components/home/HomeHero";
import { ModeCarousel } from "@/components/home/ModeCarousel";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-[6px]">
      {/* --- top panel: status strip + mode carousel --------------------- */}
      <Panel>
        <PanelHead
          icon={<CrosshairIcon className="h-[15px] w-[15px]" />}
          title="Guessing Game"
          right={
            <Link href="/how-to-play" className="focus-ring flex items-center gap-1 hover:text-cs-link">
              <ExternalIcon className="h-3 w-3" />
              How to Play
            </Link>
          }
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#22333d] bg-[#101c23] px-3 py-2">
          <Link
            href="/skins/daily"
            className="cs-btn-tan focus-ring px-3 py-[5px] font-display text-[11px] font-semibold uppercase tracking-[0.1em]"
          >
            Play Daily
          </Link>
          <span className="text-[12px] text-cs-text/90">Today&rsquo;s skin is waiting to be identified.</span>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-cs-dim2">Resets 00:00 UTC</span>
        </div>

        <ModeCarousel />
      </Panel>

      {/* --- main content panel ------------------------------------------ */}
      <Panel>
        <PanelHead
          icon={<GridIcon className="h-[15px] w-[15px]" />}
          title="Briefing"
          right={<span className="text-[10px] uppercase tracking-wide">English</span>}
        />
        <HomeHero />
      </Panel>
    </div>
  );
}

function CrosshairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3ZM5 5h5v2H6v11h11v-4h2v6H5V5Z" />
    </svg>
  );
}
