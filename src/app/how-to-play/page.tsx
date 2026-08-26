import { Panel, PanelHead } from "@/components/ui/Panel";

export default function HowToPlayPage() {
  return (
    <div className="flex flex-col gap-[6px]">
      <Panel>
        <PanelHead title="Skin Guess" />
        <ul className="space-y-1.5 p-3.5 text-[12.5px] leading-relaxed text-cs-text/90">
          <li>&#8226; Search for and select a CS2 skin to make a guess.</li>
          <li>
            &#8226; Each guess is compared against a hidden target across five attributes: color, wear, case, rarity
            and knife status.
          </li>
          <li>
            &#8226; <span className="font-semibold text-[#a5d98c]">Green</span> means an exact match,{" "}
            <span className="font-semibold text-[#e3cf76]">yellow</span> means a related or close match, and{" "}
            <span className="font-semibold text-[#e0968e]">red</span> means no match.
          </li>
          <li>&#8226; Use clues (case, rarity, color) if you get stuck. Each can only be revealed once.</li>
          <li>
            &#8226; Daily mode has one shared target for everyone that resets every 24 hours at 00:00 UTC. Unlimited
            mode gives you a new random target every game.
          </li>
        </ul>
      </Panel>

      <Panel>
        <PanelHead title="Map Guess" />
        <ul className="space-y-1.5 p-3.5 text-[12.5px] leading-relaxed text-cs-text/90">
          <li>&#8226; Identify the hidden map from the smallest visible section. You start heavily zoomed in.</li>
          <li>&#8226; Every incorrect guess reveals more of the map.</li>
          <li>
            &#8226; You have 11 guesses. Guess correctly to win, or see the full map and the answer once you run out.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
