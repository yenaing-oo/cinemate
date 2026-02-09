/*
  Warnings:

  - Made the column `runtime` on table `Movie` required. This step will fail if there are existing NULL values in that column.
  - Made the column `releaseDate` on table `Movie` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Movie" ALTER COLUMN "runtime" SET NOT NULL,
ALTER COLUMN "releaseDate" SET NOT NULL;
