-- The 2026-08-02 snapshot is replaced by the 2026-10-14 one, which the economy
-- price loader inserts on the next start.
TRUNCATE TABLE "EconomyPrice";

-- AlterTable
ALTER TABLE "EconomyPrice" DROP CONSTRAINT "EconomyPrice_pkey",
DROP COLUMN "avgPrice24h",
DROP COLUMN "avgPrice30d",
DROP COLUMN "avgPrice7d",
DROP COLUMN "avgPrice90d",
DROP COLUMN "currency",
DROP COLUMN "souvenir",
ADD COLUMN     "approximate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" DECIMAL(14,6) NOT NULL,
ADD CONSTRAINT "EconomyPrice_pkey" PRIMARY KEY ("sourceDate", "economyItemId", "marketHashName");
