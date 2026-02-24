/*
  Warnings:

  - You are about to drop the column `priceAt_purchase` on the `order_items` table. All the data in the column will be lost.
  - Added the required column `price_at_purchase` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "priceAt_purchase",
ADD COLUMN     "price_at_purchase" DECIMAL(12,2) NOT NULL;
