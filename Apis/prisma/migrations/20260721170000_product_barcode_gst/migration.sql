-- AlterTable
ALTER TABLE "products" ADD COLUMN "barcode" TEXT;
ALTER TABLE "products" ADD COLUMN "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "gstInclusive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");
