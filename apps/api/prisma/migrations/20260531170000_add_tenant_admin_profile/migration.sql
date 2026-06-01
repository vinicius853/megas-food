ALTER TABLE "tenants" ADD COLUMN "internalCode" TEXT;
ALTER TABLE "tenants" ADD COLUMN "responsibleName" TEXT;
ALTER TABLE "tenants" ADD COLUMN "city" TEXT;
ALTER TABLE "tenants" ADD COLUMN "state" TEXT;
ALTER TABLE "tenants" ADD COLUMN "address" TEXT;
ALTER TABLE "tenants" ADD COLUMN "zipCode" TEXT;
ALTER TABLE "tenants" ADD COLUMN "internalNotes" TEXT;

CREATE UNIQUE INDEX "tenants_internalCode_key" ON "tenants"("internalCode");

CREATE TABLE "tenant_internal_code_sequences" (
  "id" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "nextValue" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tenant_internal_code_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_internal_code_sequences_prefix_key" ON "tenant_internal_code_sequences"("prefix");

INSERT INTO "tenant_internal_code_sequences" ("id", "prefix", "nextValue", "updatedAt")
VALUES (
  'tenant_code_sequence_mtf',
  'MTF',
  COALESCE((SELECT COUNT(*) FROM "tenants" WHERE "slug" <> 'megastech-master'), 0) + 1,
  NOW()
)
ON CONFLICT ("prefix") DO NOTHING;
