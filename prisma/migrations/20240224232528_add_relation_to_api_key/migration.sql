-- AddForeignKey
ALTER TABLE "ApiAuthToken" ADD CONSTRAINT "ApiAuthToken_apiKey_fkey" FOREIGN KEY ("apiKey") REFERENCES "ApiCredential"("apiKey") ON DELETE RESTRICT ON UPDATE CASCADE;
