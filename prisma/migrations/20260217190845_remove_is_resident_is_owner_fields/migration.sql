/*
  Warnings:

  - You are about to drop the column `isOwner` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isResident` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isOwner",
DROP COLUMN "isResident";
