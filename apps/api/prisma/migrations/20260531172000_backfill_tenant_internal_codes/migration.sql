WITH numbered_tenants AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "name" ASC) AS row_number
  FROM "tenants"
  WHERE "internalCode" IS NULL
    AND "slug" <> 'megastech-master'
)
UPDATE "tenants"
SET "internalCode" = 'MTF-' || LPAD(numbered_tenants.row_number::text, 4, '0')
FROM numbered_tenants
WHERE "tenants"."id" = numbered_tenants."id";

UPDATE "tenant_internal_code_sequences"
SET
  "nextValue" = COALESCE((SELECT COUNT(*) FROM "tenants" WHERE "slug" <> 'megastech-master'), 0) + 1,
  "updatedAt" = NOW()
WHERE "prefix" = 'MTF';
