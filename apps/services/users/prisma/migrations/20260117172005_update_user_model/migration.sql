/*
  Warnings:

  - You are about to drop the column `store_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone_number]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_store_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "store_id",
ADD COLUMN     "bio" VARCHAR(255),
ADD COLUMN     "phone_number" VARCHAR(20),
ADD COLUMN     "profile_picture" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
