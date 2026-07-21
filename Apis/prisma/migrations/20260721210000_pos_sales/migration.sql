-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('ONLINE', 'POS');

-- AlterEnum: in-store cash sales need their own payment method distinct from COD (which implies delivery)
ALTER TYPE "PaymentMethod" ADD VALUE 'CASH';

-- AlterTable: POS sales may have no registered customer/delivery address (walk-in), so these
-- become optional, with guest name/phone captured directly on the order instead.
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "addressId" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN "channel" "OrderChannel" NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "orders" ADD COLUMN "guestName" TEXT;
ALTER TABLE "orders" ADD COLUMN "guestPhone" TEXT;
