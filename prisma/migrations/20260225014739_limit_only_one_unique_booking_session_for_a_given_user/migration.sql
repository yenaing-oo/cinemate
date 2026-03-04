/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `BookingSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BookingSession_userId_key" ON "BookingSession"("userId");
