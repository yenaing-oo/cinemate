/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[supabaseId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE IF EXISTS "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supabaseId" TEXT;

-- DropTable
DROP TABLE IF EXISTS "Account";

-- DropTable
DROP TABLE IF EXISTS "Session";

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
