import type { Metadata } from "next";
import { JetBrains_Mono, Saira, Saira_Condensed } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsProvider } from "@/lib/i18n/SettingsProvider";
import "./globals.css";

// Stand-ins for the game's proprietary Stratum2: same squared-off,
// narrow technical grotesque proportions.
const display = Saira_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const body = Saira({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Skindle — A Counter-Strike Inspired Daily Guesser",
  description: "Skindle is a daily Counter-Strike skin guessing game. One shared skin every day, four clues, unlimited practice rounds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SettingsProvider>
          <AppShell>{children}</AppShell>
        </SettingsProvider>
      </body>
    </html>
  );
}
