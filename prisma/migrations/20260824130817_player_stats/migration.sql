-- CreateTable
CREATE TABLE "PlayerStats" (
    "sessionToken" TEXT NOT NULL PRIMARY KEY,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyDateKey" TEXT,
    "daysPlayed" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDateKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
