-- AlterTable
ALTER TABLE "order_item_modifiers"
ADD COLUMN "fraction" DECIMAL(5,2),
ADD COLUMN "dependsOnOptionId" TEXT,
ADD COLUMN "metadata" JSONB;
