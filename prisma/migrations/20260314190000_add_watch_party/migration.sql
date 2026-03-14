-- CreateEnum
CREATE TYPE "WatchPartyStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "WatchParty" (
    "id" TEXT NOT NULL,
    "leaderId" UUID NOT NULL,
    "showtimeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" "WatchPartyStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchParty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchParty_inviteCode_key" ON "WatchParty"("inviteCode");

-- CreateIndex
CREATE INDEX "WatchParty_leaderId_createdAt_idx" ON "WatchParty"("leaderId", "createdAt");

-- CreateIndex
CREATE INDEX "WatchParty_showtimeId_idx" ON "WatchParty"("showtimeId");

-- AddForeignKey
ALTER TABLE "WatchParty" ADD CONSTRAINT "WatchParty_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchParty" ADD CONSTRAINT "WatchParty_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
