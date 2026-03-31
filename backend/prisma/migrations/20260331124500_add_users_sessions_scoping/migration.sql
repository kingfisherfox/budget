-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "userId" TEXT;

-- Migrated owner: log in as username "owner", password "password123", then change password in Settings.
INSERT INTO "User" ("id", "username", "passwordHash", "createdAt", "updatedAt")
VALUES (
  'cmigrationlegacy00001',
  'owner',
  '$2b$10$A1gkIAYj.9Dy4VFe8QHUiu0vpPHxUwi0GcbSFOnKOmt3QvvfGIGoG',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

UPDATE "Category" SET "userId" = 'cmigrationlegacy00001' WHERE "userId" IS NULL;

ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;

-- Replace AppSettings (int id) with per-user row keyed by userId
CREATE TABLE "AppSettings_new" (
    "userId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'THB',
    "domainName" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AppSettings_new_pkey" PRIMARY KEY ("userId")
);

INSERT INTO "AppSettings_new" ("userId", "currencyCode", "domainName")
VALUES (
  'cmigrationlegacy00001',
  COALESCE((SELECT "currencyCode" FROM "AppSettings" WHERE "id" = 1 LIMIT 1), 'THB'),
  COALESCE((SELECT "domainName" FROM "AppSettings" WHERE "id" = 1 LIMIT 1), '')
);

DROP TABLE "AppSettings";

ALTER TABLE "AppSettings_new" RENAME TO "AppSettings";

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
