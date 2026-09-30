-- AlterTable
ALTER TABLE "InventoryProjectionState" ADD COLUMN     "liveCursor" TIMESTAMP(3);

-- Start the live projection from the end of the backfill, so users it missed
-- across restarts before the cursor existed get projected once.
UPDATE "InventoryProjectionState" SET "liveCursor" = "backfillCompletedAt";
