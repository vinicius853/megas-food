CREATE TYPE "AuditLogLevel" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "level" "AuditLogLevel" NOT NULL DEFAULT 'INFO',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
