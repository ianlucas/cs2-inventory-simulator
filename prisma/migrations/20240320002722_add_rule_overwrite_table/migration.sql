-- CreateTable
CREATE TABLE "RuleOverwrite" (
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "RuleOverwrite_pkey" PRIMARY KEY ("name","userId")
);

-- AddForeignKey
ALTER TABLE "RuleOverwrite" ADD CONSTRAINT "RuleOverwrite_name_fkey" FOREIGN KEY ("name") REFERENCES "Rule"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleOverwrite" ADD CONSTRAINT "RuleOverwrite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
