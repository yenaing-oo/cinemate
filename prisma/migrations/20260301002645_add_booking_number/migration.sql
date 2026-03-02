/*
  Warnings:

  - A unique constraint covering the columns `[bookingNumber]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
