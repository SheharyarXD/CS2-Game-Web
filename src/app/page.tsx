import { prisma } from "@/lib/server/db";
import { HomePanels } from "@/components/home/HomePanels";

// The counts below are read from the database, so this page has to be rendered
// per request. Without this Next would prerender it at build time and bake in
// whatever the build machine saw, which on a serverless host is an empty (or
// unreachable) database.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Real counts straight from the seeded database, so the figures on the
  // cards can't drift away from what's actually in rotation.
  let skinCount = 0;
  let mapCount = 0;
  try {
    [skinCount, mapCount] = await Promise.all([
      prisma.skin.count({ where: { active: true } }),
      prisma.gameMap.count({ where: { active: true } }),
    ]);
  } catch {
    // The counts are chrome; if the database is unreachable the page
    // should still render rather than error out.
  }

  return <HomePanels skinCount={skinCount} mapCount={mapCount} />;
}
