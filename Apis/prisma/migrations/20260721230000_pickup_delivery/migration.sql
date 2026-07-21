-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('HOME_DELIVERY', 'PICKUP');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'HOME_DELIVERY';
ALTER TABLE "orders" ADD COLUMN "contactPhone" TEXT;
