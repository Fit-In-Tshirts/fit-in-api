/*
  Warnings:

  - You are about to drop the column `zipCode` on the `addresses` table. All the data in the column will be lost.
  - Added the required column `zipcode` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "addresses" RENAME COLUMN "zipCode" TO "zipcode";
