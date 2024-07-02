/*
  Warnings:

  - You are about to drop the `UserDomainInventory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserDomainInventory" DROP CONSTRAINT "UserDomainInventory_userId_fkey";

-- DropTable
DROP TABLE "UserDomainInventory";
