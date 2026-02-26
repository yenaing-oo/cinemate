/*
  Warnings:

  - You are about to drop the column `ticketCount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `availableSeats` on the `Showtime` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "ticketCount";

-- AlterTable
ALTER TABLE "Showtime" DROP COLUMN "availableSeats";
