-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'ModifierSelectionType'
    ) THEN
        CREATE TYPE "ModifierSelectionType" AS ENUM ('SINGLE', 'MULTIPLE');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'ModifierPricingMode'
    ) THEN
        CREATE TYPE "ModifierPricingMode" AS ENUM ('INCLUDED', 'ADDITIVE', 'REPLACE_BASE', 'HIGHEST_SELECTED');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'ProductPricingMode'
    ) THEN
        CREATE TYPE "ProductPricingMode" AS ENUM ('FIXED', 'FROM_MODIFIERS');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "pricingMode" "ProductPricingMode" NOT NULL DEFAULT 'FIXED',
ADD COLUMN "basePrice" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "selectionType" "ModifierSelectionType" NOT NULL,
    "pricingMode" "ModifierPricingMode" NOT NULL DEFAULT 'ADDITIVE',
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_options" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_modifier_groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequiredOverride" BOOLEAN,
    "minSelectionsOverride" INTEGER,
    "maxSelectionsOverride" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_modifier_options" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "modifierOptionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "priceDeltaOverride" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_option_prices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "modifierOptionId" TEXT NOT NULL,
    "dependsOnOptionId" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_option_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_modifiers" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "modifierGroupId" TEXT,
    "modifierOptionId" TEXT,
    "groupName" TEXT NOT NULL,
    "groupCode" TEXT,
    "optionName" TEXT NOT NULL,
    "optionCode" TEXT,
    "pricingMode" "ModifierPricingMode",
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE INDEX "products_tenantId_categoryId_idx" ON "products"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "products_tenantId_isActive_idx" ON "products"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "products_tenantId_sortOrder_idx" ON "products"("tenantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_groups_tenantId_code_key" ON "modifier_groups"("tenantId", "code");

-- CreateIndex
CREATE INDEX "modifier_groups_tenantId_idx" ON "modifier_groups"("tenantId");

-- CreateIndex
CREATE INDEX "modifier_groups_tenantId_isActive_idx" ON "modifier_groups"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "modifier_groups_tenantId_sortOrder_idx" ON "modifier_groups"("tenantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_options_tenantId_groupId_name_key" ON "modifier_options"("tenantId", "groupId", "name");

-- CreateIndex
CREATE INDEX "modifier_options_tenantId_idx" ON "modifier_options"("tenantId");

-- CreateIndex
CREATE INDEX "modifier_options_groupId_idx" ON "modifier_options"("groupId");

-- CreateIndex
CREATE INDEX "modifier_options_tenantId_isActive_idx" ON "modifier_options"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "modifier_options_tenantId_sortOrder_idx" ON "modifier_options"("tenantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_groups_tenantId_productId_modifierGroupId_key" ON "product_modifier_groups"("tenantId", "productId", "modifierGroupId");

-- CreateIndex
CREATE INDEX "product_modifier_groups_tenantId_idx" ON "product_modifier_groups"("tenantId");

-- CreateIndex
CREATE INDEX "product_modifier_groups_productId_idx" ON "product_modifier_groups"("productId");

-- CreateIndex
CREATE INDEX "product_modifier_groups_modifierGroupId_idx" ON "product_modifier_groups"("modifierGroupId");

-- CreateIndex
CREATE INDEX "product_modifier_groups_tenantId_productId_sortOrder_idx" ON "product_modifier_groups"("tenantId", "productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_options_tenantId_productId_modifierOptionId_key" ON "product_modifier_options"("tenantId", "productId", "modifierOptionId");

-- CreateIndex
CREATE INDEX "product_modifier_options_tenantId_idx" ON "product_modifier_options"("tenantId");

-- CreateIndex
CREATE INDEX "product_modifier_options_productId_idx" ON "product_modifier_options"("productId");

-- CreateIndex
CREATE INDEX "product_modifier_options_modifierGroupId_idx" ON "product_modifier_options"("modifierGroupId");

-- CreateIndex
CREATE INDEX "product_modifier_options_modifierOptionId_idx" ON "product_modifier_options"("modifierOptionId");

-- CreateIndex
CREATE INDEX "product_modifier_options_tenantId_productId_modifierGroupId_idx" ON "product_modifier_options"("tenantId", "productId", "modifierGroupId");

-- CreateIndex
CREATE INDEX "product_modifier_options_tenantId_productId_sortOrder_idx" ON "product_modifier_options"("tenantId", "productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_option_prices_tenantId_productId_modifierOptionId_dependsOnOptionId_key" ON "modifier_option_prices"("tenantId", "productId", "modifierOptionId", "dependsOnOptionId");

-- CreateIndex
CREATE INDEX "modifier_option_prices_tenantId_idx" ON "modifier_option_prices"("tenantId");

-- CreateIndex
CREATE INDEX "modifier_option_prices_productId_idx" ON "modifier_option_prices"("productId");

-- CreateIndex
CREATE INDEX "modifier_option_prices_modifierOptionId_idx" ON "modifier_option_prices"("modifierOptionId");

-- CreateIndex
CREATE INDEX "modifier_option_prices_dependsOnOptionId_idx" ON "modifier_option_prices"("dependsOnOptionId");

-- CreateIndex
CREATE INDEX "modifier_option_prices_tenantId_productId_idx" ON "modifier_option_prices"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_orderItemId_idx" ON "order_item_modifiers"("orderItemId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_modifierGroupId_idx" ON "order_item_modifiers"("modifierGroupId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_modifierOptionId_idx" ON "order_item_modifiers"("modifierOptionId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_orderItemId_sortOrder_idx" ON "order_item_modifiers"("orderItemId", "sortOrder");

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_options" ADD CONSTRAINT "product_modifier_options_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_options" ADD CONSTRAINT "product_modifier_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_options" ADD CONSTRAINT "product_modifier_options_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_options" ADD CONSTRAINT "product_modifier_options_modifierOptionId_fkey" FOREIGN KEY ("modifierOptionId") REFERENCES "modifier_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_option_prices" ADD CONSTRAINT "modifier_option_prices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_option_prices" ADD CONSTRAINT "modifier_option_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_option_prices" ADD CONSTRAINT "modifier_option_prices_modifierOptionId_fkey" FOREIGN KEY ("modifierOptionId") REFERENCES "modifier_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_option_prices" ADD CONSTRAINT "modifier_option_prices_dependsOnOptionId_fkey" FOREIGN KEY ("dependsOnOptionId") REFERENCES "modifier_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifierOptionId_fkey" FOREIGN KEY ("modifierOptionId") REFERENCES "modifier_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
