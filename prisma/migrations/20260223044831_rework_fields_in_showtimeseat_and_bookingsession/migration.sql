/*
  Warnings:

  - You are about to drop the column `status` on the `BookingSession` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `ShowtimeSeat` table. All the data in the column will be lost.
  - You are about to drop the column `heldAt` on the `ShowtimeSeat` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ShowtimeSeat` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ShowtimeSeat_expiresAt_idx";

-- DropIndex
DROP INDEX "ShowtimeSeat_heldByUserId_idx";

-- DropIndex
DROP INDEX "ShowtimeSeat_showtimeId_status_idx";

-- AlterTable
ALTER TABLE "BookingSession" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "ShowtimeSeat" DROP COLUMN "expiresAt",
DROP COLUMN "heldAt",
DROP COLUMN "status",
ADD COLUMN     "heldTill" TIMESTAMP(3),
ADD COLUMN     "isBooked" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "BookingSessionStatus";

-- DropEnum
DROP TYPE "SeatStatus";

-- CreateIndex
CREATE INDEX "ShowtimeSeat_heldByUserId_heldTill_idx" ON "ShowtimeSeat"("heldByUserId", "heldTill");

-- CreateIndex
CREATE INDEX "ShowtimeSeat_heldTill_idx" ON "ShowtimeSeat"("heldTill");
