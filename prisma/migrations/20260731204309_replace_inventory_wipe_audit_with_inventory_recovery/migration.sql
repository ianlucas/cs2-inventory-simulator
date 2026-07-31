/*
  Warnings:

  - You are about to drop the `InventoryWipeAudit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InventoryWipeAudit" DROP CONSTRAINT "InventoryWipeAudit_userId_fkey";

-- DropTable
DROP TABLE "InventoryWipeAudit";

-- CreateTable
CREATE TABLE "InventoryRecovery" (
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "inventory" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InventoryRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryRecovery_userId_idx" ON "InventoryRecovery"("userId");

-- AddForeignKey
ALTER TABLE "InventoryRecovery" ADD CONSTRAINT "InventoryRecovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
