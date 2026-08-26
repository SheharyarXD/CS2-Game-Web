import { cn } from "@/lib/utils";

/** A menu panel with the client's lighter title strip across the top. */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("cs-panel", className)}>{children}</section>;
}

export function PanelHead({
  icon,
  title,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="cs-panel-head flex items-center gap-2 px-3 py-[7px]">
      {icon && <span className="text-cs-link">{icon}</span>}
      <h2 className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-white">{title}</h2>
      {right && <div className="ml-auto flex items-center gap-1.5 text-[11px] text-cs-dim">{right}</div>}
    </div>
  );
}
