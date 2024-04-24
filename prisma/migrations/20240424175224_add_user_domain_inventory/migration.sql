-- CreateTable
CREATE TABLE "UserDomainInventory" (
    "domainHostname" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "inventory" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserDomainInventory_pkey" PRIMARY KEY ("domainHostname","userId")
);

-- AddForeignKey
ALTER TABLE "UserDomainInventory" ADD CONSTRAINT "UserDomainInventory_domainHostname_fkey" FOREIGN KEY ("domainHostname") REFERENCES "Domain"("hostname") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDomainInventory" ADD CONSTRAINT "UserDomainInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
