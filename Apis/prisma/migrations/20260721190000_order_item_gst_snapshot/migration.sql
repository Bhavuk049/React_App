-- AlterTable: snapshot GST rate/inclusivity onto each order item, same as name/price are
-- snapshotted — so historical invoices stay accurate even if a product's GST changes later.
ALTER TABLE "order_items" ADD COLUMN "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN "gstInclusive" BOOLEAN NOT NULL DEFAULT true;
