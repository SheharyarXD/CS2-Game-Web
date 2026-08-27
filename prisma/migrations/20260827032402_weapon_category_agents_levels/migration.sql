-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlayerStats" (
    "sessionToken" TEXT NOT NULL PRIMARY KEY,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyDateKey" TEXT,
    "daysPlayed" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDateKey" TEXT,
    "gamesTowardLevel" INTEGER NOT NULL DEFAULT 0,
    "serviceMedals" TEXT NOT NULL DEFAULT '[]',
    "agentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayerStats_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlayerStats" ("createdAt", "dailyStreak", "daysPlayed", "gamesPlayed", "lastActiveDateKey", "lastDailyDateKey", "sessionToken", "updatedAt") SELECT "createdAt", "dailyStreak", "daysPlayed", "gamesPlayed", "lastActiveDateKey", "lastDailyDateKey", "sessionToken", "updatedAt" FROM "PlayerStats";
DROP TABLE "PlayerStats";
ALTER TABLE "new_PlayerStats" RENAME TO "PlayerStats";
CREATE TABLE "new_Skin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weapon" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "caseOrCollection" TEXT,
    "caseType" TEXT,
    "wear" TEXT NOT NULL,
    "availableWears" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorSource" TEXT NOT NULL,
    "weaponCategory" TEXT NOT NULL DEFAULT 'rifle',
    "searchText" TEXT NOT NULL,
    "isKnife" BOOLEAN NOT NULL DEFAULT false,
    "isGlove" BOOLEAN NOT NULL DEFAULT false,
    "hasStatTrak" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "sourceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Skin" ("active", "availableWears", "caseOrCollection", "caseType", "color", "colorSource", "createdAt", "displayName", "hasStatTrak", "id", "imageUrl", "isGlove", "isKnife", "name", "popularity", "rarity", "searchText", "sourceId", "updatedAt", "weapon", "wear") SELECT "active", "availableWears", "caseOrCollection", "caseType", "color", "colorSource", "createdAt", "displayName", "hasStatTrak", "id", "imageUrl", "isGlove", "isKnife", "name", "popularity", "rarity", "searchText", "sourceId", "updatedAt", "weapon", "wear" FROM "Skin";
DROP TABLE "Skin";
ALTER TABLE "new_Skin" RENAME TO "Skin";
CREATE INDEX "Skin_active_idx" ON "Skin"("active");
CREATE INDEX "Skin_weapon_idx" ON "Skin"("weapon");
CREATE INDEX "Skin_rarity_idx" ON "Skin"("rarity");
CREATE INDEX "Skin_searchText_idx" ON "Skin"("searchText");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Agent_active_idx" ON "Agent"("active");
