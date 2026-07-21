-- AlterEnum: distinguish UPI received on the shop's personal UPI ID from the business one,
-- for in-store (POS) sales.
ALTER TYPE "PaymentMethod" ADD VALUE 'UPI_PERSONAL';
