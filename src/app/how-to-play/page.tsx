"use client";

import { Panel, PanelHead } from "@/components/ui/Panel";
import { useT } from "@/lib/i18n/SettingsProvider";

export default function HowToPlayPage() {
  const t = useT();

  return (
    <div className="flex flex-col gap-[6px]">
      <Panel>
        <PanelHead title={t("howto.skinTitle")} />
        <ul className="space-y-1.5 p-3.5 text-[12.5px] leading-relaxed text-cs-text/90">
          <li>&#8226; {t("howto.skin1")}</li>
          <li>&#8226; {t("howto.skin2")}</li>
          <li>&#8226; {t("howto.skin3")}</li>
          <li>&#8226; {t("howto.skin4")}</li>
          <li>&#8226; {t("howto.skin5")}</li>
        </ul>
      </Panel>

      <Panel>
        <PanelHead title={t("howto.mapTitle")} />
        <ul className="space-y-1.5 p-3.5 text-[12.5px] leading-relaxed text-cs-text/90">
          <li>&#8226; {t("howto.map1")}</li>
          <li>&#8226; {t("howto.map2")}</li>
          <li>&#8226; {t("howto.map3")}</li>
        </ul>
      </Panel>
    </div>
  );
}
