/*
  Warnings:

  - You are about to drop the column `createdAt` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `priceAtPurchase` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `idempotencyKey` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotency_key]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceAt_purchase` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idempotency_key` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping_address` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_mount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropIndex
DROP INDEX "order_items_orderId_idx";

-- DropIndex
DROP INDEX "order_items_productId_idx";

-- DropIndex
DROP INDEX "orders_idempotencyKey_key";

-- DropIndex
DROP INDEX "orders_storeId_idx";

-- DropIndex
DROP INDEX "orders_userId_idx";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "createdAt",
DROP COLUMN "orderId",
DROP COLUMN "priceAtPurchase",
DROP COLUMN "productId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "order_id" UUID NOT NULL,
ADD COLUMN     "priceAt_purchase" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "createdAt",
DROP COLUMN "idempotencyKey",
DROP COLUMN "shippingAddress",
DROP COLUMN "storeId",
DROP COLUMN "totalAmount",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idempotency_key" VARCHAR(255) NOT NULL,
ADD COLUMN     "shipping_address" JSONB NOT NULL,
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "total_mount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_store_id_idx" ON "orders"("store_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
