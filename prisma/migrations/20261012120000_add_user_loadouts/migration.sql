-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeLoadoutId" TEXT;

-- CreateTable
CREATE TABLE "UserLoadout" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserLoadout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLoadout_userId_idx" ON "UserLoadout"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_activeLoadoutId_key" ON "User"("activeLoadoutId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeLoadoutId_fkey" FOREIGN KEY ("activeLoadoutId") REFERENCES "UserLoadout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLoadout" ADD CONSTRAINT "UserLoadout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

