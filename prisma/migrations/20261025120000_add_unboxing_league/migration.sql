-- CreateTable
CREATE TABLE "UserUnlock" (
    "containerId" INTEGER NOT NULL,
    "counted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "keyId" INTEGER,
    "payout" DECIMAL(18,2) NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "rarity" TEXT NOT NULL,
    "seed" INTEGER,
    "statTrak" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "wear" DOUBLE PRECISION,

    CONSTRAINT "UserUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnboxingLeagueRanking" (
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "previousGeneratedAt" TIMESTAMP(3),
    "rankedCount" INTEGER NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnboxingLeagueRanking_pkey" PRIMARY KEY ("weekStart")
);

-- CreateTable
CREATE TABLE "UnboxingLeagueEntry" (
    "bestItemId" INTEGER NOT NULL,
    "bestPayout" DECIMAL(18,2) NOT NULL,
    "bestStatTrak" BOOLEAN NOT NULL,
    "bestWear" DOUBLE PRECISION,
    "previousRank" INTEGER,
    "profit" DECIMAL(18,2) NOT NULL,
    "rank" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnboxingLeagueEntry_pkey" PRIMARY KEY ("weekStart","userId")
);

-- CreateIndex
CREATE INDEX "UserUnlock_userId_createdAt_idx" ON "UserUnlock"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserUnlock_createdAt_idx" ON "UserUnlock"("createdAt");

-- CreateIndex
CREATE INDEX "UnboxingLeagueEntry_weekStart_rank_idx" ON "UnboxingLeagueEntry"("weekStart", "rank");

-- AddForeignKey
ALTER TABLE "UserUnlock" ADD CONSTRAINT "UserUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnboxingLeagueEntry" ADD CONSTRAINT "UnboxingLeagueEntry_weekStart_fkey" FOREIGN KEY ("weekStart") REFERENCES "UnboxingLeagueRanking"("weekStart") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnboxingLeagueEntry" ADD CONSTRAINT "UnboxingLeagueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

