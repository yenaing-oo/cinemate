/*
  Warnings:

  - A unique constraint covering the columns `[watchPartyId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WatchPartyStatus" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'CONFIRMED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "watchPartyId" TEXT;

-- AlterTable
ALTER TABLE "BookingSession" ADD COLUMN     "watchPartyId" TEXT;

-- CreateTable
CREATE TABLE "WatchParty" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "hostUserId" UUID,
    "inviteCode" TEXT NOT NULL,
    "showtimeId" TEXT,
    "status" "WatchPartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WatchPartyParticipants" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WatchPartyParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchParty_inviteCode_key" ON "WatchParty"("inviteCode");

-- CreateIndex
CREATE INDEX "_WatchPartyParticipants_B_index" ON "_WatchPartyParticipants"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_watchPartyId_key" ON "Booking"("watchPartyId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_watchPartyId_fkey" FOREIGN KEY ("watchPartyId") REFERENCES "WatchParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSession" ADD CONSTRAINT "BookingSession_watchPartyId_fkey" FOREIGN KEY ("watchPartyId") REFERENCES "WatchParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchParty" ADD CONSTRAINT "WatchParty_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchParty" ADD CONSTRAINT "WatchParty_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WatchPartyParticipants" ADD CONSTRAINT "_WatchPartyParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WatchPartyParticipants" ADD CONSTRAINT "_WatchPartyParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "WatchParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
