CREATE TYPE "BillingInvoiceStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE', 'CANCELLED');

CREATE TYPE "BillingPaymentMethod" AS ENUM ('MERCADO_PAGO', 'MANUAL');

CREATE TABLE "billing_invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "paymentMethod" "BillingPaymentMethod",
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "mercadoPagoPaymentStatus" TEXT,
    "paymentUrl" TEXT,
    "sandboxPaymentUrl" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_webhook_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT,
    "eventType" TEXT,
    "resourceId" TEXT,
    "payload" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payment_webhook_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "billing_invoices_tenantId_idx" ON "billing_invoices"("tenantId");
CREATE INDEX "billing_invoices_status_idx" ON "billing_invoices"("status");
CREATE INDEX "billing_invoices_dueDate_idx" ON "billing_invoices"("dueDate");
CREATE UNIQUE INDEX "billing_invoices_mercadoPagoPreferenceId_key" ON "billing_invoices"("mercadoPagoPreferenceId");
CREATE UNIQUE INDEX "billing_invoices_mercadoPagoPaymentId_key" ON "billing_invoices"("mercadoPagoPaymentId");

CREATE INDEX "payment_webhook_logs_provider_idx" ON "payment_webhook_logs"("provider");
CREATE INDEX "payment_webhook_logs_resourceId_idx" ON "payment_webhook_logs"("resourceId");
CREATE UNIQUE INDEX "payment_webhook_logs_provider_eventId_key" ON "payment_webhook_logs"("provider", "eventId");

ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
