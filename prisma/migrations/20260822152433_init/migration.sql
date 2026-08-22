-- CreateTable
CREATE TABLE "Skin" (
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

-- CreateTable
CREATE TABLE "GameMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageWidth" INTEGER NOT NULL,
    "imageHeight" INTEGER NOT NULL,
    "focalX" INTEGER NOT NULL DEFAULT 50,
    "focalY" INTEGER NOT NULL DEFAULT 50,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailySkinGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateKey" TEXT NOT NULL,
    "skinId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailySkinGame_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "Skin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "dateKey" TEXT,
    "targetSkinId" TEXT,
    "targetMapId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "cluesUsed" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "GameSession_targetSkinId_fkey" FOREIGN KEY ("targetSkinId") REFERENCES "Skin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GameSession_targetMapId_fkey" FOREIGN KEY ("targetMapId") REFERENCES "GameMap" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameGuess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "guessOrder" INTEGER NOT NULL,
    "guessedSkinId" TEXT,
    "guessedMapId" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameGuess_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Skin_active_idx" ON "Skin"("active");

-- CreateIndex
CREATE INDEX "Skin_weapon_idx" ON "Skin"("weapon");

-- CreateIndex
CREATE INDEX "Skin_rarity_idx" ON "Skin"("rarity");

-- CreateIndex
CREATE INDEX "Skin_searchText_idx" ON "Skin"("searchText");

-- CreateIndex
CREATE INDEX "GameMap_active_idx" ON "GameMap"("active");

-- CreateIndex
CREATE UNIQUE INDEX "DailySkinGame_dateKey_key" ON "DailySkinGame"("dateKey");

-- CreateIndex
CREATE INDEX "GameSession_sessionToken_idx" ON "GameSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_sessionToken_mode_dateKey_key" ON "GameSession"("sessionToken", "mode", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "GameGuess_sessionId_guessOrder_key" ON "GameGuess"("sessionId", "guessOrder");
