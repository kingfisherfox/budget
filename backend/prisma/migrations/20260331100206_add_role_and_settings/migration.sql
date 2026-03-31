-- AlterTable
ALTER TABLE "AppSettings" RENAME CONSTRAINT "AppSettings_new_pkey" TO "AppSettings_pkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "signupsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
