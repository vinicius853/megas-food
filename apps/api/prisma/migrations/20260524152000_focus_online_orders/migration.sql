BEGIN;

UPDATE "orders"
SET "type" = 'ONLINE'
WHERE "type" = 'TABLE';

UPDATE "orders"
SET "status" = 'CONFIRMED'
WHERE "status" = 'IN_KITCHEN';

UPDATE "users"
SET "role" = 'CLIENT_ADMIN'
WHERE "role" IN ('WAITER', 'KITCHEN');

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_tableId_fkey";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "tableId";

DROP TABLE IF EXISTS "restaurant_tables";

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM (
  'MASTER_OWNER',
  'MASTER_ADMIN',
  'CLIENT_OWNER',
  'CLIENT_ADMIN',
  'CASHIER'
);
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole"
  USING "role"::text::"UserRole";
DROP TYPE "UserRole_old";

ALTER TYPE "OrderType" RENAME TO "OrderType_old";
CREATE TYPE "OrderType" AS ENUM (
  'ONLINE',
  'TAKEAWAY',
  'DELIVERY'
);
ALTER TABLE "orders"
  ALTER COLUMN "type" TYPE "OrderType"
  USING "type"::text::"OrderType";
DROP TYPE "OrderType_old";

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
);
ALTER TABLE "orders"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING "status"::text::"OrderStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "OrderStatus_old";

DROP TYPE IF EXISTS "TableStatus";

COMMIT;
