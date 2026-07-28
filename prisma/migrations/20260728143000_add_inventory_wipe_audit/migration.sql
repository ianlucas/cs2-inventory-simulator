-- CreateTable
CREATE TABLE "InventoryWipeAudit" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "inventory" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InventoryWipeAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryWipeAudit_userId_idx" ON "InventoryWipeAudit"("userId");

-- AddForeignKey
ALTER TABLE "InventoryWipeAudit" ADD CONSTRAINT "InventoryWipeAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
