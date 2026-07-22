-- CreateTable
CREATE TABLE "product_stock_logs" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_stock_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_stock_logs_productId_idx" ON "product_stock_logs"("productId");

-- AddForeignKey
ALTER TABLE "product_stock_logs" ADD CONSTRAINT "product_stock_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_stock_logs" ADD CONSTRAINT "product_stock_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
