/*
  Warnings:

  - You are about to drop the `Domain` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserDomainInventory" DROP CONSTRAINT "UserDomainInventory_domainHostname_fkey";

-- DropTable
DROP TABLE "Domain";
