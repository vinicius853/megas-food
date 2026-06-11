-- Remove foreign keys owned by legacy tables before dropping them.
ALTER TABLE "order_item_flavors"
  DROP CONSTRAINT IF EXISTS "order_item_flavors_orderItemId_fkey",
  DROP CONSTRAINT IF EXISTS "order_item_flavors_flavorId_fkey";

ALTER TABLE "pizza_flavor_prices"
  DROP CONSTRAINT IF EXISTS "pizza_flavor_prices_productId_fkey",
  DROP CONSTRAINT IF EXISTS "pizza_flavor_prices_sizeId_fkey",
  DROP CONSTRAINT IF EXISTS "pizza_flavor_prices_flavorId_fkey";

ALTER TABLE "pizza_border_prices"
  DROP CONSTRAINT IF EXISTS "pizza_border_prices_productId_fkey",
  DROP CONSTRAINT IF EXISTS "pizza_border_prices_sizeId_fkey",
  DROP CONSTRAINT IF EXISTS "pizza_border_prices_borderId_fkey";

ALTER TABLE "pizza_flavors"
  DROP CONSTRAINT IF EXISTS "pizza_flavors_categoryId_fkey";

ALTER TABLE "pizza_sizes"
  DROP CONSTRAINT IF EXISTS "pizza_sizes_productId_fkey";

-- Remove legacy order snapshots and pizza configuration tables.
DROP TABLE "order_item_flavors";
DROP TABLE "pizza_flavor_prices";
DROP TABLE "pizza_border_prices";
DROP TABLE "pizza_flavors";
DROP TABLE "pizza_borders";
DROP TABLE "pizza_sizes";

ALTER TABLE "order_items"
  DROP COLUMN "sizeId",
  DROP COLUMN "borderId",
  DROP COLUMN "sizeName",
  DROP COLUMN "borderName";

-- Menu management is now generic for every tenant.
DROP INDEX IF EXISTS "tenants_menuManagementMode_idx";
ALTER TABLE "tenants" DROP COLUMN "menuManagementMode";

DROP TYPE "PizzaSizeType";
DROP TYPE "MenuManagementMode";
