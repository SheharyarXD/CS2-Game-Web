-- CreateTable
CREATE TABLE "Skin" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameMap" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageWidth" INTEGER NOT NULL,
    "imageHeight" INTEGER NOT NULL,
    "focalX" INTEGER NOT NULL DEFAULT 50,
    "focalY" INTEGER NOT NULL DEFAULT 50,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySkinGame" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "skinId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySkinGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "dateKey" TEXT,
    "targetSkinId" TEXT,
    "targetMapId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "cluesUsed" TEXT NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameGuess" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guessOrder" INTEGER NOT NULL,
    "guessedSkinId" TEXT,
    "guessedMapId" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameGuess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "sessionToken" TEXT NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyDateKey" TEXT,
    "daysPlayed" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDateKey" TEXT,
    "gamesTowardLevel" INTEGER NOT NULL DEFAULT 0,
    "serviceMedals" TEXT NOT NULL DEFAULT '[]',
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "Agent_active_idx" ON "Agent"("active");

-- AddForeignKey
ALTER TABLE "DailySkinGame" ADD CONSTRAINT "DailySkinGame_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "Skin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_targetSkinId_fkey" FOREIGN KEY ("targetSkinId") REFERENCES "Skin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_targetMapId_fkey" FOREIGN KEY ("targetMapId") REFERENCES "GameMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameGuess" ADD CONSTRAINT "GameGuess_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

