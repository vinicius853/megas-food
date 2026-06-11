-- CreateEnum
CREATE TYPE "MenuManagementMode" AS ENUM ('LEGACY', 'GENERIC');

-- AlterTable
ALTER TABLE "tenants"
ADD COLUMN "menuManagementMode" "MenuManagementMode" NOT NULL DEFAULT 'LEGACY';

-- CreateIndex
CREATE INDEX "tenants_menuManagementMode_idx" ON "tenants"("menuManagementMode");
