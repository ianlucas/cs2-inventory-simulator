-- DropForeignKey
ALTER TABLE "EconomyPrice" DROP CONSTRAINT "EconomyPrice_economyItemId_fkey";

-- AlterTable
ALTER TABLE "EconomyItem" ADD COLUMN     "removed" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "EconomyPrice" ADD CONSTRAINT "EconomyPrice_economyItemId_fkey" FOREIGN KEY ("economyItemId") REFERENCES "EconomyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
