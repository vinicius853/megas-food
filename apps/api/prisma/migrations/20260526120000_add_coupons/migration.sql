CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

CREATE TABLE "coupons" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "CouponType" NOT NULL,
  "value" DECIMAL(10, 2) NOT NULL,
  "minimumOrderValue" DECIMAL(10, 2),
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_tenantId_code_key" ON "coupons"("tenantId", "code");

ALTER TABLE "coupons"
  ADD CONSTRAINT "coupons_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD COLUMN "discountAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "couponCode" TEXT,
  ADD COLUMN "totalBeforeDiscount" DECIMAL(10, 2);
