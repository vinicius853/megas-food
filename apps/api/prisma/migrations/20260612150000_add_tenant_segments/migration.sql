-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TenantSegment'
  ) THEN
    CREATE TYPE "TenantSegment" AS ENUM (
      'PIZZARIA',
      'HAMBURGUERIA',
      'ACAITERIA',
      'PASTELARIA'
    );
  END IF;
END $$;

-- AlterTable
ALTER TABLE "tenants"
ADD COLUMN "enabledSegments" "TenantSegment"[] NOT NULL
DEFAULT ARRAY['PIZZARIA']::"TenantSegment"[];
