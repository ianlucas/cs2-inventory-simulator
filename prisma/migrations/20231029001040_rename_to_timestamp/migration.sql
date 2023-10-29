/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `UserCache` table. All the data in the column will be lost.
  - Added the required column `timestamp` to the `UserCache` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserCache" (
    "timestamp" DATETIME NOT NULL,
    "response" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("url", "userId"),
    CONSTRAINT "UserCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserCache" ("response", "url", "userId") SELECT "response", "url", "userId" FROM "UserCache";
DROP TABLE "UserCache";
ALTER TABLE "new_UserCache" RENAME TO "UserCache";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
