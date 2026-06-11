-- AlterTable
ALTER TABLE "product_modifier_options"
ADD COLUMN "displayCategoryId" TEXT;

-- CreateTable
CREATE TABLE "product_modifier_option_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceOptionId" TEXT NOT NULL,
    "targetGroupId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minSelections" INTEGER,
    "maxSelections" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_modifier_option_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_modifier_options_displayCategoryId_idx"
ON "product_modifier_options"("displayCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_option_rules_tenantId_productId_sourceOptionId_targetGroupId_key"
ON "product_modifier_option_rules"("tenantId", "productId", "sourceOptionId", "targetGroupId");

-- CreateIndex
CREATE INDEX "product_modifier_option_rules_tenantId_idx"
ON "product_modifier_option_rules"("tenantId");

-- CreateIndex
CREATE INDEX "product_modifier_option_rules_productId_idx"
ON "product_modifier_option_rules"("productId");

-- CreateIndex
CREATE INDEX "product_modifier_option_rules_sourceOptionId_idx"
ON "product_modifier_option_rules"("sourceOptionId");

-- CreateIndex
CREATE INDEX "product_modifier_option_rules_targetGroupId_idx"
ON "product_modifier_option_rules"("targetGroupId");

-- CreateIndex
CREATE INDEX "product_modifier_option_rules_tenantId_productId_idx"
ON "product_modifier_option_rules"("tenantId", "productId");

-- AddForeignKey
ALTER TABLE "product_modifier_options"
ADD CONSTRAINT "product_modifier_options_displayCategoryId_fkey"
FOREIGN KEY ("displayCategoryId") REFERENCES "categories"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_option_rules"
ADD CONSTRAINT "product_modifier_option_rules_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_option_rules"
ADD CONSTRAINT "product_modifier_option_rules_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_option_rules"
ADD CONSTRAINT "product_modifier_option_rules_sourceOptionId_fkey"
FOREIGN KEY ("sourceOptionId") REFERENCES "modifier_options"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_option_rules"
ADD CONSTRAINT "product_modifier_option_rules_targetGroupId_fkey"
FOREIGN KEY ("targetGroupId") REFERENCES "modifier_groups"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
