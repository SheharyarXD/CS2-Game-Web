/**
 * Imports the playable agent portraits used by the profile picture picker.
 *
 * Source: the same public ByMykel/CSGO-API dataset the skins come from, so
 * there is no extra provider to authenticate against or scrape. Safe to run
 * repeatedly — every agent is upserted by its upstream id.
 */
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const DEFAULT_SOURCE_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json";
const RAW_PATH = path.resolve(process.cwd(), "data", "raw", "agents.json");

interface RawAgent {
  id: string;
  name: string;
  image: string;
  rarity: { id: string; name: string; color: string } | null;
  team: { id: string; name: string } | null;
}

async function loadRawAgents(): Promise<RawAgent[]> {
  if (!existsSync(RAW_PATH)) {
    const url = process.env.AGENT_DATA_SOURCE_URL || DEFAULT_SOURCE_URL;
    console.log(`Fetching agent data from ${url} ...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch agent data: ${res.status} ${res.statusText}`);
    const body = await res.text();
    await mkdir(path.dirname(RAW_PATH), { recursive: true });
    await writeFile(RAW_PATH, body, "utf-8");
  }
  return JSON.parse(await readFile(RAW_PATH, "utf-8")) as RawAgent[];
}

/** "Sir Bloody Darryl | The Professionals" -> "Sir Bloody Darryl" */
function toShortName(name: string): string {
  const [head] = name.split("|");
  return (head ?? name).trim();
}

async function main() {
  const raw = await loadRawAgents();
  let imported = 0;
  let skipped = 0;

  for (const agent of raw) {
    if (!agent.image || !agent.team) {
      skipped += 1;
      continue;
    }

    const data = {
      name: agent.name,
      shortName: toShortName(agent.name),
      imageUrl: agent.image,
      team: agent.team.name,
      rarity: agent.rarity?.name ?? "Unknown",
      active: true,
    };

    await prisma.agent.upsert({
      where: { id: agent.id },
      update: data,
      create: { id: agent.id, ...data },
    });
    imported += 1;
  }

  console.log(`Done. Imported/updated ${imported} agents (${skipped} skipped for missing image/team).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
