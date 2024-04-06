-- AlterTable
ALTER TABLE "UserRule" RENAME CONSTRAINT "RuleOverwrite_pkey" TO "UserRule_pkey";

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "GroupRule" (
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "GroupRule_pkey" PRIMARY KEY ("groupId","name")
);

-- RenameForeignKey
ALTER TABLE "UserRule" RENAME CONSTRAINT "RuleOverwrite_name_fkey" TO "UserRule_name_fkey";

-- RenameForeignKey
ALTER TABLE "UserRule" RENAME CONSTRAINT "RuleOverwrite_userId_fkey" TO "UserRule_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRule" ADD CONSTRAINT "GroupRule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRule" ADD CONSTRAINT "GroupRule_name_fkey" FOREIGN KEY ("name") REFERENCES "Rule"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
