/*
  Warnings:

  - The values [CLOSED] on the enum `TableStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TableStatus_new" AS ENUM ('AVAILABLE', 'OCCUPIED', 'WAITING_PAYMENT', 'RESERVED');
ALTER TABLE "public"."restaurant_tables" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "restaurant_tables" ALTER COLUMN "status" TYPE "TableStatus_new" USING ("status"::text::"TableStatus_new");
ALTER TYPE "TableStatus" RENAME TO "TableStatus_old";
ALTER TYPE "TableStatus_new" RENAME TO "TableStatus";
DROP TYPE "public"."TableStatus_old";
ALTER TABLE "restaurant_tables" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "number" SERIAL NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3);
