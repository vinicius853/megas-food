ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "annualPrice" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "setupFee" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "contractedMonthlyPrice" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "contractedAnnualPrice" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "contractedSetupFee" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "contractedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

UPDATE "subscriptions" subscription
SET "contractedMonthlyPrice" = plan."monthlyPrice"
FROM "plans" plan
WHERE subscription."planId" = plan."id"
  AND subscription."contractedMonthlyPrice" IS NULL;

UPDATE "subscriptions"
SET "contractedAt" = COALESCE("startedAt", "createdAt", NOW())
WHERE "contractedAt" IS NULL;

ALTER TABLE "subscriptions"
  ALTER COLUMN "contractedMonthlyPrice" SET NOT NULL,
  ALTER COLUMN "contractedAt" SET NOT NULL,
  ALTER COLUMN "contractedAt" SET DEFAULT NOW();

