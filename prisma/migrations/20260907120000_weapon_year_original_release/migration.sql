-- AlterTable
ALTER TABLE "Skin" DROP COLUMN "availableWears",
DROP COLUMN "wear",
ADD COLUMN     "containers" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "releaseDate" TIMESTAMP(3),
ADD COLUMN     "releaseYear" INTEGER,
ADD COLUMN     "sourceContainerId" TEXT;

-- CreateIndex
CREATE INDEX "Skin_releaseYear_idx" ON "Skin"("releaseYear");

