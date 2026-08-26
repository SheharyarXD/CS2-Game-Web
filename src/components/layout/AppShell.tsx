import { PlayerPanel } from "./PlayerPanel";
import { StatusReadout } from "./StatusReadout";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 gap-[6px] px-1.5 pb-3 pt-[6px] sm:px-2">
        <PlayerPanel />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <StatusReadout />
    </div>
  );
}
