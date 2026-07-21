-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'UPI', 'CARD');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL;
