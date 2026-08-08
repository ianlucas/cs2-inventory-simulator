/*
  Warnings:

  - The `exterior` column on the `EconomyPrice` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CS2ItemWear" AS ENUM ('FN', 'MW', 'FT', 'WW', 'BS');

-- AlterTable
ALTER TABLE "EconomyPrice" DROP COLUMN "exterior",
ADD COLUMN     "exterior" "CS2ItemWear";
