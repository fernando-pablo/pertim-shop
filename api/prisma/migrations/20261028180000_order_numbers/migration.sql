-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "last_order_number" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;
