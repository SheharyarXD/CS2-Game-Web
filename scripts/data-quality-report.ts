/**
 * Validation pass over the imported skin data.
 *
 * Reports the totals and, more importantly, the gaps: anything the
 * importer could not determine is counted and listed rather than being
 * filled in with a guess. Release years and original containers are
 * gameplay-critical, so those get named examples to chase down.
 *
 * Usage: npm run data:report
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ContainerRef {
  id: string;
  name: string;
  type: string | null;
  releaseDate: string | null;
}

function section(title: string) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

function row(label: string, value: string | number) {
  console.log(`  ${label.padEnd(44, ".")} ${value}`);
}

async function main() {
  // The report measures the playable pool. Rows deactivated by a prune are
  // counted separately rather than inflating the totals.
  const skins = await prisma.skin.findMany({ where: { active: true } });
  const inactive = await prisma.skin.count({ where: { active: false } });
  if (skins.length === 0) {
    console.log("No skins in the database. Run `npm run seed:skins` first.");
    return;
  }

  const rare = skins.filter((s) => s.rarity === "extraordinary");
  const weapons = new Set(skins.map((s) => s.weapon));
  const cases = new Set(skins.filter((s) => s.caseType === "case" && s.caseOrCollection).map((s) => s.caseOrCollection!));
  const collections = new Set(
    skins.filter((s) => s.caseType === "collection" && s.caseOrCollection).map((s) => s.caseOrCollection!),
  );

  const missingImage = skins.filter((s) => !s.imageUrl);
  const missingYear = skins.filter((s) => s.releaseYear === null);
  const missingWeapon = skins.filter((s) => !s.weapon);
  const missingRarity = skins.filter((s) => !s.rarity);
  const missingContainer = skins.filter((s) => !s.caseOrCollection);
  const fallbackColor = skins.filter((s) => s.colorSource === "fallback");

  // A duplicate here means two rows a player could not tell apart in the
  // search box, which would make one of them an unfair target.
  const byDisplayName = new Map<string, number>();
  for (const s of skins) byDisplayName.set(s.displayName, (byDisplayName.get(s.displayName) ?? 0) + 1);
  const duplicateNames = [...byDisplayName.entries()].filter(([, n]) => n > 1);
  const duplicateIds = skins.length - new Set(skins.map((s) => s.id)).size;

  // Multi-container skins are where the original-release rule earns its
  // keep. Ambiguous = several candidates and no date on any of them, so
  // the choice could not be made on evidence.
  let multiContainer = 0;
  let ambiguousOriginal = 0;
  const ambiguousExamples: string[] = [];
  for (const s of skins) {
    let containers: ContainerRef[] = [];
    try {
      containers = JSON.parse(s.containers) as ContainerRef[];
    } catch {
      containers = [];
    }
    if (containers.length > 1) {
      multiContainer += 1;
      if (!containers.some((c) => c.releaseDate)) {
        ambiguousOriginal += 1;
        if (ambiguousExamples.length < 10) ambiguousExamples.push(s.displayName);
      }
    }
  }

  const years = skins.map((s) => s.releaseYear).filter((y): y is number => y !== null);

  section("Totals");
  row("total skins (active, playable)", skins.length);
  row("retired rows kept for game history", inactive);
  row("Rare Special Items (knives + gloves)", rare.length);
  row("  knives", skins.filter((s) => s.isKnife).length);
  row("  gloves", skins.filter((s) => s.isGlove).length);
  row("distinct weapons", weapons.size);
  row("distinct cases", cases.size);
  row("distinct collections", collections.size);
  row("distinct containers", cases.size + collections.size);
  row("release years covered", years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "none");

  section("Rarity spread");
  const rarityCounts = new Map<string, number>();
  for (const s of skins) rarityCounts.set(s.rarity, (rarityCounts.get(s.rarity) ?? 0) + 1);
  for (const [key, count] of [...rarityCounts.entries()].sort((a, b) => b[1] - a[1])) row(key, count);

  section("Missing / unresolved");
  row("missing images", missingImage.length);
  row("missing release years", missingYear.length);
  row("missing weapon values", missingWeapon.length);
  row("missing rarity values", missingRarity.length);
  row("missing case/collection", missingContainer.length);
  row("colour fell back (image unreadable)", fallbackColor.length);

  section("Duplicates");
  row("duplicate ids", duplicateIds);
  row("duplicate display names", duplicateNames.length);
  for (const [name, n] of duplicateNames.slice(0, 10)) console.log(`    ${name} x${n}`);

  section("Original release container");
  row("skins in more than one container", multiContainer);
  row("ambiguous (no date on any candidate)", ambiguousOriginal);
  for (const name of ambiguousExamples) console.log(`    ${name}`);

  if (missingYear.length > 0) {
    section("Skins without a release year (first 20)");
    for (const s of missingYear.slice(0, 20)) {
      console.log(`    ${s.displayName} — container: ${s.caseOrCollection ?? "none"}`);
    }
  }

  const problems = missingImage.length + missingWeapon.length + missingRarity.length + duplicateIds;
  section("Verdict");
  if (problems === 0) {
    console.log("  No gameplay-critical gaps: every skin has an id, image, weapon and rarity.");
  } else {
    console.log(`  ${problems} gameplay-critical gaps need attention (see above).`);
  }
  if (missingYear.length > 0 || ambiguousOriginal > 0) {
    console.log(
      `  ${missingYear.length} skins compare as "unknown" on Year and ${ambiguousOriginal} have an ` +
        "undeterminable original container. These are flagged, not invented.",
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
