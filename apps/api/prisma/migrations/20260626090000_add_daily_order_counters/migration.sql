ALTER TABLE "orders"
  ADD COLUMN "dailyNumber" INTEGER,
  ADD COLUMN "businessDate" DATE;

CREATE TABLE "daily_order_counters" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "businessDate" DATE NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "daily_order_counters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_order_counters_tenantId_businessDate_key"
  ON "daily_order_counters"("tenantId", "businessDate");

CREATE INDEX "daily_order_counters_tenantId_idx"
  ON "daily_order_counters"("tenantId");

CREATE UNIQUE INDEX "orders_tenantId_businessDate_dailyNumber_key"
  ON "orders"("tenantId", "businessDate", "dailyNumber");

CREATE INDEX "orders_tenantId_businessDate_idx"
  ON "orders"("tenantId", "businessDate");

ALTER TABLE "daily_order_counters"
  ADD CONSTRAINT "daily_order_counters_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
