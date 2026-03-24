-- DropIndex
DROP INDEX "Booking_watchPartyId_key";

-- CreateIndex
CREATE INDEX "Booking_watchPartyId_idx" ON "Booking"("watchPartyId");
