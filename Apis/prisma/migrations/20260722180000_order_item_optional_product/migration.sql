-- AlterTable: allow order items with no backing product (custom POS charges)
ALTER TABLE "order_items" ALTER COLUMN "productId" DROP NOT NULL;
