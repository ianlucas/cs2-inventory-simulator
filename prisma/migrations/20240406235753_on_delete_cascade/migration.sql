-- DropForeignKey
ALTER TABLE "ApiAuthToken" DROP CONSTRAINT "ApiAuthToken_apiKey_fkey";

-- DropForeignKey
ALTER TABLE "GroupRule" DROP CONSTRAINT "GroupRule_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupRule" DROP CONSTRAINT "GroupRule_name_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_groupId_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRule" DROP CONSTRAINT "UserRule_name_fkey";

-- DropForeignKey
ALTER TABLE "UserRule" DROP CONSTRAINT "UserRule_userId_fkey";

-- AddForeignKey
ALTER TABLE "ApiAuthToken" ADD CONSTRAINT "ApiAuthToken_apiKey_fkey" FOREIGN KEY ("apiKey") REFERENCES "ApiCredential"("apiKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRule" ADD CONSTRAINT "UserRule_name_fkey" FOREIGN KEY ("name") REFERENCES "Rule"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRule" ADD CONSTRAINT "UserRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRule" ADD CONSTRAINT "GroupRule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRule" ADD CONSTRAINT "GroupRule_name_fkey" FOREIGN KEY ("name") REFERENCES "Rule"("name") ON DELETE CASCADE ON UPDATE CASCADE;
