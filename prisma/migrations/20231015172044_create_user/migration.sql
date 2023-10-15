-- CreateTable
CREATE TABLE "User" (
    "avatar" TEXT NOT NULL,
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventory" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
