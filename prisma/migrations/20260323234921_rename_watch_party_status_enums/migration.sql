/*
  Warnings:

  - The values [ACTIVE,IN_PROGRESS] on the enum `WatchPartyStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WatchPartyStatus_new" AS ENUM ('OPEN', 'CLOSED', 'CONFIRMED');
ALTER TABLE "public"."WatchParty" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "WatchParty" ALTER COLUMN "status" TYPE "WatchPartyStatus_new" USING ("status"::text::"WatchPartyStatus_new");
ALTER TYPE "WatchPartyStatus" RENAME TO "WatchPartyStatus_old";
ALTER TYPE "WatchPartyStatus_new" RENAME TO "WatchPartyStatus";
DROP TYPE "public"."WatchPartyStatus_old";
ALTER TABLE "WatchParty" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable
ALTER TABLE "WatchParty" ALTER COLUMN "status" SET DEFAULT 'OPEN';
