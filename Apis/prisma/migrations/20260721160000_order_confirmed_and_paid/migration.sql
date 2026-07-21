-- Rename the "PAID" status to "CONFIRMED" — order status is a fulfillment stage,
-- not a payment state (payment is now tracked separately via "isPaid").
ALTER TYPE "OrderStatus" RENAME VALUE 'PAID' TO 'CONFIRMED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- Orders placed via UPI/CARD were paid instantly at checkout; backfill accordingly.
UPDATE "orders" SET "isPaid" = true WHERE "paymentMethod" IN ('UPI', 'CARD');
