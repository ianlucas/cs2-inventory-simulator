-- CreateTable
CREATE TABLE "EconomyPrice" (
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "economyItemId" INTEGER NOT NULL,
    "exterior" TEXT,
    "last24h" DECIMAL(14,6),
    "last7d" DECIMAL(14,6),
    "last30d" DECIMAL(14,6),
    "last90d" DECIMAL(14,6),
    "marketHashName" TEXT NOT NULL,
    "sourceDate" DATE NOT NULL,
    "souvenir" BOOLEAN NOT NULL DEFAULT false,
    "statTrak" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EconomyPrice_pkey" PRIMARY KEY ("sourceDate","marketHashName")
);

-- CreateTable
CREATE TABLE "EconomyPriceMeta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastAttemptedAt" TIMESTAMP(3),
    "lastAttemptedSourceDate" DATE,
    "lastFailureAt" TIMESTAMP(3),
    "lastFailureMessage" TEXT,
    "lastSucceededAt" TIMESTAMP(3),
    "lastSucceededSourceDate" DATE,
    "lastUnmatchedCount" INTEGER,
    "lastUnmatchedNames" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomyPriceMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EconomyPrice_economyItemId_sourceDate_idx" ON "EconomyPrice"("economyItemId", "sourceDate");

-- AddForeignKey
ALTER TABLE "EconomyPrice" ADD CONSTRAINT "EconomyPrice_economyItemId_fkey" FOREIGN KEY ("economyItemId") REFERENCES "EconomyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
