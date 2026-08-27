"use client";

import Link from "next/link";
import { Panel, PanelHead } from "@/components/ui/Panel";
import { useT } from "@/lib/i18n/SettingsProvider";

export default function SkinModeSelectPage() {
  const t = useT();

  return (
    <Panel>
      <PanelHead title={t("nav.skins")} />
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        <ModeCard
          href="/skins/daily"
          title={t("mode.dailySkin")}
          body={t("mode.dailySkinBody")}
          cta={t("home.playDaily")}
          accent="border-[#547187]"
        />
        <ModeCard
          href="/skins/unlimited"
          title={t("mode.unlimited")}
          body={t("mode.unlimitedBody")}
          cta={t("mode.startRound")}
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
