-- CreateTable
CREATE TABLE "ApiAuthToken" (
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ApiAuthToken_pkey" PRIMARY KEY ("token")
);

-- AddForeignKey
ALTER TABLE "ApiAuthToken" ADD CONSTRAINT "ApiAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
