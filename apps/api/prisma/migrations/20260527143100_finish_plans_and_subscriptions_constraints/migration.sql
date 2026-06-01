CREATE UNIQUE INDEX IF NOT EXISTS "plans_slug_key" ON "plans"("slug");
CREATE INDEX IF NOT EXISTS "subscriptions_tenantId_idx" ON "subscriptions"("tenantId");
CREATE INDEX IF NOT EXISTS "subscriptions_planId_idx" ON "subscriptions"("planId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_nextBillingDate_idx" ON "subscriptions"("nextBillingDate");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_mercadoPagoSubscriptionId_key" ON "subscriptions"("mercadoPagoSubscriptionId");
CREATE INDEX IF NOT EXISTS "billing_invoices_planId_idx" ON "billing_invoices"("planId");
CREATE INDEX IF NOT EXISTS "billing_invoices_subscriptionId_idx" ON "billing_invoices"("subscriptionId");

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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_tenantId_fkey'
    ) THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_planId_fkey'
    ) THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoices_planId_fkey'
    ) THEN
        ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoices_subscriptionId_fkey'
    ) THEN
        ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
