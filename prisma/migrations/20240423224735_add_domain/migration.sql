-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);
