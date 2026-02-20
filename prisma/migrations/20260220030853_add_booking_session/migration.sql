-- CreateEnum
CREATE TYPE "BookingStep" AS ENUM ('TICKET_QUANTITY', 'SEAT_SELECTION', 'CHECKOUT');

-- CreateEnum
CREATE TYPE "BookingSessionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'COMPLETED');

-- AlterTable
ALTER TABLE "ShowtimeSeat" ADD COLUMN     "bookingSessionId" TEXT;

-- CreateTable
CREATE TABLE "BookingSession" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "showtimeId" TEXT NOT NULL,
    "step" "BookingStep" NOT NULL,
    "ticketCount" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingSession_userId_idx" ON "BookingSession"("userId");

-- CreateIndex
CREATE INDEX "BookingSession_showtimeId_idx" ON "BookingSession"("showtimeId");

-- CreateIndex
CREATE INDEX "BookingSession_expiresAt_idx" ON "BookingSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "ShowtimeSeat" ADD CONSTRAINT "ShowtimeSeat_bookingSessionId_fkey" FOREIGN KEY ("bookingSessionId") REFERENCES "BookingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSession" ADD CONSTRAINT "BookingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSession" ADD CONSTRAINT "BookingSession_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
