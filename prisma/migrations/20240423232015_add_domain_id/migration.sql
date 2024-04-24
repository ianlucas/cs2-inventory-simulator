/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserCache` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserGroup` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserPreference` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserRule` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ApiAuthToken" DROP CONSTRAINT "ApiAuthToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserCache" DROP CONSTRAINT "UserCache_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRule" DROP CONSTRAINT "UserRule_userId_fkey";

-- DropIndex
DROP INDEX "User_id_key";

-- AlterTable
ALTER TABLE "ApiAuthToken" ADD COLUMN     "domainId" TEXT NOT NULL DEFAULT 'localhost';

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "domainId" TEXT NOT NULL DEFAULT 'localhost',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id", "domainId");

-- AlterTable
ALTER TABLE "UserCache" DROP CONSTRAINT "UserCache_pkey",
ADD COLUMN     "domainId" TEXT NOT NULL DEFAULT 'localhost',
ADD CONSTRAINT "UserCache_pkey" PRIMARY KEY ("url", "userId", "domainId");

-- AlterTable
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_pkey",
ADD COLUMN     "domainId" TEXT NOT NULL DEFAULT 'localhost',
ADD CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("groupId", "userId", "domainId");

-- AlterTable
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_pkey",
ADD COLUMN     "domainId" TEXT NOT NULL DEFAULT 'localhost',
ADD CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId", "domainId");

-- AlterTable
ALTER TABLE "UserRule" DROP CONSTRAINT "UserRule_pkey",
ADD COLUMN     "domainId" TEXT NOT NULL DEFAULT 'localhost',
ADD CONSTRAINT "UserRule_pkey" PRIMARY KEY ("name", "userId", "domainId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCache" ADD CONSTRAINT "UserCache_userId_domainId_fkey" FOREIGN KEY ("userId", "domainId") REFERENCES "User"("id", "domainId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_domainId_fkey" FOREIGN KEY ("userId", "domainId") REFERENCES "User"("id", "domainId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiAuthToken" ADD CONSTRAINT "ApiAuthToken_userId_domainId_fkey" FOREIGN KEY ("userId", "domainId") REFERENCES "User"("id", "domainId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRule" ADD CONSTRAINT "UserRule_userId_domainId_fkey" FOREIGN KEY ("userId", "domainId") REFERENCES "User"("id", "domainId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_domainId_fkey" FOREIGN KEY ("userId", "domainId") REFERENCES "User"("id", "domainId") ON DELETE CASCADE ON UPDATE CASCADE;
