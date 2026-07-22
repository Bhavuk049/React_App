-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "additionalCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "roundOffAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
