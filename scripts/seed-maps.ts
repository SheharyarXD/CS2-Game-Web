import { PrismaClient } from "@prisma/client";
import { MAP_POOL } from "../data/maps";

const prisma = new PrismaClient();

async function main() {
  for (const map of MAP_POOL) {
    await prisma.gameMap.upsert({
      where: { id: map.id },
      update: {
        name: map.name,
        imageUrl: `/maps/${map.id}.svg`,
        imageWidth: 1024,
        imageHeight: 1024,
        focalX: map.focalX ?? 50,
        focalY: map.focalY ?? 50,
        active: true,
      },
      create: {
        id: map.id,
        name: map.name,
        imageUrl: `/maps/${map.id}.svg`,
        imageWidth: 1024,
        imageHeight: 1024,
        focalX: map.focalX ?? 50,
        focalY: map.focalY ?? 50,
        active: true,
      },
    });
    console.log(`upserted map: ${map.name}`);
  }
  console.log(`Done. ${MAP_POOL.length} maps in rotation.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
