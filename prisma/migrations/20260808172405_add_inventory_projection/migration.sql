-- CreateTable
CREATE TABLE "EconomyItem" (
    "altName" TEXT,
    "base" BOOLEAN NOT NULL,
    "baseItemId" INTEGER,
    "category" TEXT,
    "collection" TEXT,
    "def" INTEGER,
    "free" BOOLEAN NOT NULL,
    "id" INTEGER NOT NULL,
    "model" TEXT,
    "name" TEXT NOT NULL,
    "rarity" TEXT,
    "type" TEXT NOT NULL,

    CONSTRAINT "EconomyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventoryItem" (
    "charges" INTEGER,
    "containerUid" INTEGER,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "equippedCT" BOOLEAN NOT NULL DEFAULT false,
    "equippedT" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "inventoryKey" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemUpdatedAt" TIMESTAMP(3),
    "nameTag" TEXT,
    "seed" INTEGER,
    "sourceContainerId" INTEGER,
    "statTrak" INTEGER,
    "uid" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "wear" DOUBLE PRECISION,

    CONSTRAINT "UserInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventoryItemSticker" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "rotation" DOUBLE PRECISION,
    "schema" INTEGER,
    "slot" INTEGER NOT NULL,
    "userInventoryItemId" TEXT NOT NULL,
    "wear" DOUBLE PRECISION,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,

    CONSTRAINT "UserInventoryItemSticker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventoryItemPatch" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "userInventoryItemId" TEXT NOT NULL,

    CONSTRAINT "UserInventoryItemPatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventoryItemKeychain" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "seed" INTEGER,
    "slot" INTEGER NOT NULL,
    "userInventoryItemId" TEXT NOT NULL,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "z" DOUBLE PRECISION,

    CONSTRAINT "UserInventoryItemKeychain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventoryProjection" (
    "failedSyncedAt" TIMESTAMP(3),
    "projectedAt" TIMESTAMP(3),
    "projectedSyncedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserInventoryProjection_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "InventoryProjectionMeta" (
    "backfillCompletedAt" TIMESTAMP(3),
    "backfillCursor" TEXT,
    "cs2LibVersion" TEXT,
    "economyProjectionVersion" INTEGER NOT NULL DEFAULT 1,
    "id" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryProjectionMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserInventoryItem_itemId_idx" ON "UserInventoryItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventoryItem_userId_inventoryKey_key" ON "UserInventoryItem"("userId", "inventoryKey");

-- CreateIndex
CREATE INDEX "UserInventoryItemSticker_itemId_idx" ON "UserInventoryItemSticker"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventoryItemSticker_userInventoryItemId_slot_key" ON "UserInventoryItemSticker"("userInventoryItemId", "slot");

-- CreateIndex
CREATE INDEX "UserInventoryItemPatch_itemId_idx" ON "UserInventoryItemPatch"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventoryItemPatch_userInventoryItemId_slot_key" ON "UserInventoryItemPatch"("userInventoryItemId", "slot");

-- CreateIndex
CREATE INDEX "UserInventoryItemKeychain_itemId_idx" ON "UserInventoryItemKeychain"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventoryItemKeychain_userInventoryItemId_slot_key" ON "UserInventoryItemKeychain"("userInventoryItemId", "slot");

-- CreateIndex
CREATE INDEX "User_syncedAt_idx" ON "User"("syncedAt");

-- AddForeignKey
ALTER TABLE "UserInventoryItem" ADD CONSTRAINT "UserInventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventoryItemSticker" ADD CONSTRAINT "UserInventoryItemSticker_userInventoryItemId_fkey" FOREIGN KEY ("userInventoryItemId") REFERENCES "UserInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventoryItemPatch" ADD CONSTRAINT "UserInventoryItemPatch_userInventoryItemId_fkey" FOREIGN KEY ("userInventoryItemId") REFERENCES "UserInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventoryItemKeychain" ADD CONSTRAINT "UserInventoryItemKeychain_userInventoryItemId_fkey" FOREIGN KEY ("userInventoryItemId") REFERENCES "UserInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventoryProjection" ADD CONSTRAINT "UserInventoryProjection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
