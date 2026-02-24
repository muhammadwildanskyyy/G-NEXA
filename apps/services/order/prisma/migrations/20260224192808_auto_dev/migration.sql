/*
  Warnings:

  - You are about to drop the column `total_mount` on the `orders` table. All the data in the column will be lost.
  - Added the required column `total_price` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "total_mount",
ADD COLUMN     "total_price" DECIMAL(12,2) NOT NULL;
