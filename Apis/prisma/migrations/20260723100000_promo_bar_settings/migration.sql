-- AlterTable: admin-controlled promo bar shown on the storefront
ALTER TABLE "store_settings" ADD COLUMN "promoBarEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "store_settings" ADD COLUMN "promoBarMessages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
