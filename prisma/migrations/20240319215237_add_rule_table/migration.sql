-- CreateTable
CREATE TABLE "Rule" (
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "value" TEXT NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rule_name_key" ON "Rule"("name");
