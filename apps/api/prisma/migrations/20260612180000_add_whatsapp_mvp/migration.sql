DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WhatsAppProvider') THEN
    CREATE TYPE "WhatsAppProvider" AS ENUM ('EVOLUTION_API');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WhatsAppConnectionStatus') THEN
    CREATE TYPE "WhatsAppConnectionStatus" AS ENUM ('DISCONNECTED', 'AWAITING_CONFIGURATION', 'CONNECTED', 'ERROR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WhatsAppEventType') THEN
    CREATE TYPE "WhatsAppEventType" AS ENUM ('ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_READY', 'ORDER_OUT_FOR_DELIVERY', 'ORDER_DELIVERED', 'TEST');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WhatsAppNotificationStatus') THEN
    CREATE TYPE "WhatsAppNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DRY_RUN', 'SKIPPED', 'FAILED');
  END IF;
END $$;

CREATE TABLE "whatsapp_connections" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "provider" "WhatsAppProvider" NOT NULL DEFAULT 'EVOLUTION_API',
  "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
  "status" "WhatsAppConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
  "instanceName" TEXT,
  "connectedPhone" TEXT,
  "enabledEvents" "WhatsAppEventType"[] NOT NULL DEFAULT ARRAY['ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_READY', 'ORDER_OUT_FOR_DELIVERY']::"WhatsAppEventType"[],
  "lastError" TEXT,
  "lastConnectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_notifications" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderId" TEXT,
  "eventType" "WhatsAppEventType" NOT NULL,
  "status" "WhatsAppNotificationStatus" NOT NULL DEFAULT 'PENDING',
  "dedupeKey" TEXT NOT NULL,
  "recipient" TEXT,
  "providerMessageId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whatsapp_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_connections_tenantId_key" ON "whatsapp_connections"("tenantId");
CREATE INDEX "whatsapp_connections_status_idx" ON "whatsapp_connections"("status");
CREATE UNIQUE INDEX "whatsapp_notifications_dedupeKey_key" ON "whatsapp_notifications"("dedupeKey");
CREATE INDEX "whatsapp_notifications_tenantId_createdAt_idx" ON "whatsapp_notifications"("tenantId", "createdAt");
CREATE INDEX "whatsapp_notifications_status_scheduledAt_idx" ON "whatsapp_notifications"("status", "scheduledAt");
CREATE INDEX "whatsapp_notifications_orderId_idx" ON "whatsapp_notifications"("orderId");

ALTER TABLE "whatsapp_connections"
  ADD CONSTRAINT "whatsapp_connections_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_notifications"
  ADD CONSTRAINT "whatsapp_notifications_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_notifications"
  ADD CONSTRAINT "whatsapp_notifications_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
