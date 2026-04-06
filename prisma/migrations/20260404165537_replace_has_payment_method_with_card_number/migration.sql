/*
  Warnings:

  - You are about to drop the column `hasPaymentMethod` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "hasPaymentMethod",
ADD COLUMN     "cardNumber" TEXT;
