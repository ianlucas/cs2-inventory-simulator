-- AlterTable
ALTER TABLE "UserInventoryItem" ADD COLUMN     "highlight" INTEGER,
ADD COLUMN     "souvenir" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserInventoryItemKeychain" ADD COLUMN     "highlight" INTEGER;

-- AlterTable
ALTER TABLE "UserUnlock" ADD COLUMN     "souvenir" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UnboxingLeagueEntry" ADD COLUMN     "bestSouvenir" BOOLEAN NOT NULL DEFAULT false;

