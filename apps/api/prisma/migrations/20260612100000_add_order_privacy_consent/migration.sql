-- Additive LGPD consent snapshot for public orders.
ALTER TABLE "orders"
ADD COLUMN "privacyAcceptedAt" TIMESTAMP(3),
ADD COLUMN "privacyPolicyVersion" TEXT,
ADD COLUMN "privacyAcceptedIp" TEXT,
ADD COLUMN "privacyAcceptedUserAgent" TEXT;
