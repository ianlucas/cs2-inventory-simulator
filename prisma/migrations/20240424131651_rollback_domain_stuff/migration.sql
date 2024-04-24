/*
  Warnings:

  - You are about to drop the column `domainId` on the `ApiAuthToken` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `domainId` on the `User` table. All the data in the column will be lost.
  - The primary key for the `UserCache` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `domainId` on the `UserCache` table. All the data in the column will be lost.
  - The primary key for the `UserGroup` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `domainId` on the `UserGroup` table. All the data in the column will be lost.
  - The primary key for the `UserPreference` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `domainId` on the `UserPreference` table. All the data in the column will be lost.
  - The primary key for the `UserRule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `domainId` on the `UserRule` table. All the data in the column will be lost.
  - You are about to drop the `Domain` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApiAuthToken" DROP CONSTRAINT "ApiAuthToken_userId_domainId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_domainId_fkey";

-- DropForeignKey
ALTER TABLE "UserCache" DROP CONSTRAINT "UserCache_userId_domainId_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_userId_domainId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_userId_domainId_fkey";

-- DropForeignKey
ALTER TABLE "UserRule" DROP CONSTRAINT "UserRule_userId_domainId_fkey";

-- AlterTable
ALTER TABLE "ApiAuthToken" DROP COLUMN "domainId";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "domainId",
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserCache" DROP CONSTRAINT "UserCache_pkey",
DROP COLUMN "domainId",
ADD CONSTRAINT "UserCache_pkey" PRIMARY KEY ("url", "userId");

-- AlterTable
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_pkey",
DROP COLUMN "domainId",
ADD CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("groupId", "userId");

-- AlterTable
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_pkey",
DROP COLUMN "domainId",
ADD CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "UserRule" DROP CONSTRAINT "UserRule_pkey",
DROP COLUMN "domainId",
ADD CONSTRAINT "UserRule_pkey" PRIMARY KEY ("name", "userId");

-- DropTable
DROP TABLE "Domain";

-- AddForeignKey
ALTER TABLE "UserCache" ADD CONSTRAINT "UserCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiAuthToken" ADD CONSTRAINT "ApiAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRule" ADD CONSTRAINT "UserRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
