-- Rename tables, columns and the wear enum to match domain vocabulary.
-- Constraints/indexes are renamed alongside so Prisma's default naming stays in sync.

-- Enum: the stored value is the market exterior bucket, not the wear float.
ALTER TYPE "CS2ItemWear" RENAME TO "CS2ItemExterior";

-- User
ALTER TABLE "User" RENAME COLUMN "inventory" TO "rawInventory";
ALTER TABLE "User" RENAME COLUMN "lastSeen" TO "lastSeenAt";

-- EconomyItem: these columns store keys/colors, not display values.
ALTER TABLE "EconomyItem" RENAME COLUMN "rarity" TO "rarityColor";
ALTER TABLE "EconomyItem" RENAME COLUMN "collection" TO "collectionKey";
ALTER TABLE "EconomyItem" RENAME COLUMN "model" TO "modelKey";

-- EconomyPrice: average price over the window.
ALTER TABLE "EconomyPrice" RENAME COLUMN "last24h" TO "avgPrice24h";
ALTER TABLE "EconomyPrice" RENAME COLUMN "last7d" TO "avgPrice7d";
ALTER TABLE "EconomyPrice" RENAME COLUMN "last30d" TO "avgPrice30d";
ALTER TABLE "EconomyPrice" RENAME COLUMN "last90d" TO "avgPrice90d";

-- UserInventoryProjection: these are watermarks copied from User.syncedAt.
ALTER TABLE "UserInventoryProjection" RENAME COLUMN "projectedSyncedAt" TO "projectedUserSyncedAt";
ALTER TABLE "UserInventoryProjection" RENAME COLUMN "failedSyncedAt" TO "failedUserSyncedAt";

-- UserCache -> UserApiResponseCache. The column holds a copy of User.syncedAt
-- used as the cache-validity watermark, not the time the row was written.
ALTER TABLE "UserCache" RENAME COLUMN "timestamp" TO "userSyncedAt";
ALTER TABLE "UserCache" RENAME TO "UserApiResponseCache";
ALTER INDEX "UserCache_pkey" RENAME TO "UserApiResponseCache_pkey";
ALTER TABLE "UserApiResponseCache" RENAME CONSTRAINT "UserCache_userId_fkey" TO "UserApiResponseCache_userId_fkey";

-- InventoryRecovery -> UserInventoryRecovery
ALTER TABLE "InventoryRecovery" RENAME COLUMN "inventory" TO "rawInventory";
ALTER TABLE "InventoryRecovery" RENAME TO "UserInventoryRecovery";
ALTER INDEX "InventoryRecovery_pkey" RENAME TO "UserInventoryRecovery_pkey";
ALTER INDEX "InventoryRecovery_userId_idx" RENAME TO "UserInventoryRecovery_userId_idx";
ALTER TABLE "UserInventoryRecovery" RENAME CONSTRAINT "InventoryRecovery_userId_fkey" TO "UserInventoryRecovery_userId_fkey";

-- ApiAuthToken: name the FK after the relationship.
ALTER TABLE "ApiAuthToken" RENAME COLUMN "apiKey" TO "credentialApiKey";
ALTER TABLE "ApiAuthToken" RENAME CONSTRAINT "ApiAuthToken_apiKey_fkey" TO "ApiAuthToken_credentialApiKey_fkey";

-- Singleton job-state tables.
ALTER TABLE "EconomyPriceMeta" RENAME TO "EconomyPriceSyncState";
ALTER INDEX "EconomyPriceMeta_pkey" RENAME TO "EconomyPriceSyncState_pkey";
ALTER TABLE "InventoryProjectionMeta" RENAME TO "InventoryProjectionState";
ALTER INDEX "InventoryProjectionMeta_pkey" RENAME TO "InventoryProjectionState_pkey";
