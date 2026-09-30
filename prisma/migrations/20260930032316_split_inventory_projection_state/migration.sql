-- CreateTable
CREATE TABLE "EconomyProjectionState" (
    "cs2LibVersion" TEXT,
    "economyProjectionVersion" INTEGER NOT NULL DEFAULT 1,
    "id" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomyProjectionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventoryProjectionState" (
    "backfillCompletedAt" TIMESTAMP(3),
    "backfillCursor" TEXT,
    "id" INTEGER NOT NULL DEFAULT 1,
    "liveCursor" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInventoryProjectionState_pkey" PRIMARY KEY ("id")
);

-- Copy the existing state, so neither the economy projection nor the user
-- inventory backfill reruns.
INSERT INTO "EconomyProjectionState" ("cs2LibVersion", "economyProjectionVersion", "id", "updatedAt")
SELECT "cs2LibVersion", "economyProjectionVersion", "id", "updatedAt"
FROM "InventoryProjectionState";

INSERT INTO "UserInventoryProjectionState" ("backfillCompletedAt", "backfillCursor", "id", "liveCursor", "updatedAt")
SELECT "backfillCompletedAt", "backfillCursor", "id", "liveCursor", "updatedAt"
FROM "InventoryProjectionState";

-- DropTable
DROP TABLE "InventoryProjectionState";
