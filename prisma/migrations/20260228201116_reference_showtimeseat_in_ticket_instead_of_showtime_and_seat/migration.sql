/*
  Warnings:

  - You are about to drop the column `seatId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `showtimeId` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `showtimeSeatId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_seatId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_showtimeId_fkey";

-- DropIndex
DROP INDEX "Ticket_seatId_showtimeId_idx";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "seatId",
DROP COLUMN "showtimeId",
ADD COLUMN     "showtimeSeatId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Ticket_showtimeSeatId_idx" ON "Ticket"("showtimeSeatId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_showtimeSeatId_fkey" FOREIGN KEY ("showtimeSeatId") REFERENCES "ShowtimeSeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
