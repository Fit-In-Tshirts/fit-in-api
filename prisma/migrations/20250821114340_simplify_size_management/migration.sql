/*
  Warnings:

  - You are about to drop the column `categoryId` on the `sizes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `sizes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "sizes" DROP CONSTRAINT "sizes_categoryId_fkey";

-- DropIndex
DROP INDEX "sizes_name_categoryId_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "sizeGuide" VARCHAR(500);

-- AlterTable
ALTER TABLE "sizes" DROP COLUMN "categoryId",
ADD COLUMN     "description" VARCHAR(50);

-- CreateTable
CREATE TABLE "product_sizes" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sizeId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_sizes_productId_idx" ON "product_sizes"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_sizes_productId_sizeId_key" ON "product_sizes"("productId", "sizeId");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_name_key" ON "sizes"("name");

-- AddForeignKey
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
