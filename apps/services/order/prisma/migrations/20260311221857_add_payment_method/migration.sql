/*
  Warnings:

  - Added the required column `payment_method` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VA', 'QRIS');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "bank_code" VARCHAR(50),
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL;
