-- RenameConstraint
ALTER TABLE "UserPreference" RENAME CONSTRAINT "UserPreferences_pkey" TO "UserPreference_pkey";

-- AddColumn
ALTER TABLE "UserPreference" ADD COLUMN "hideFilters" TEXT;

-- RenameForeignKey
ALTER TABLE "UserPreference" RENAME CONSTRAINT "UserPreferences_userId_fkey" TO "UserPreference_userId_fkey";