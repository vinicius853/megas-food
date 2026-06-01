INSERT INTO "audit_logs" (
  "id",
  "actorEmail",
  "action",
  "target",
  "level",
  "metadata",
  "createdAt"
)
SELECT
  gen_random_uuid()::text,
  'Sistema',
  'Criou pizzaria',
  t."name",
  'INFO',
  jsonb_build_object('tenantId', t."id", 'slug', t."slug", 'backfilled', true),
  t."createdAt"
FROM "tenants" t
WHERE NOT EXISTS (
  SELECT 1
  FROM "audit_logs" a
  WHERE a."action" = 'Criou pizzaria'
    AND a."target" = t."name"
);
