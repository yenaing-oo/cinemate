/*
  Warnings:

  - A unique constraint covering the columns `[movieId,startTime]` on the table `Showtime` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Showtime_movieId_startTime_key" ON "Showtime"("movieId", "startTime");
