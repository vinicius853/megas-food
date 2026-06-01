CREATE TYPE "SubscriptionStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'PAST_DUE',
    'CANCEL_SCHEDULED',
    'CANCELED',
    'BLOCKED'
);

CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "mercadoPagoSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "accessUntil" TIMESTAMP(3),
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "billing_invoices" ADD COLUMN "planId" TEXT;
ALTER TABLE "billing_invoices" ADD COLUMN "subscriptionId" TEXT;

CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");
CREATE INDEX "subscriptions_tenantId_idx" ON "subscriptions"("tenantId");
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscriptions_nextBillingDate_idx" ON "subscriptions"("nextBillingDate");
CREATE UNIQUE INDEX "subscriptions_mercadoPagoSubscriptionId_key" ON "subscriptions"("mercadoPagoSubscriptionId");
CREATE INDEX "billing_invoices_planId_idx" ON "billing_invoices"("planId");
CREATE INDEX "billing_invoices_subscriptionId_idx" ON "billing_invoices"("subscriptionId");

INSERT INTO "plans" (
    "id",
    "name",
    "slug",
    "monthlyPrice",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    'plan_megas_food_monthly',
    'Plano Megas Food',
    'plano-megas-food',
    150.00,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
