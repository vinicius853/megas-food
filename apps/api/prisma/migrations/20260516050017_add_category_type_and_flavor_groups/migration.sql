-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PRODUCT_SECTION', 'PIZZA_FLAVOR_GROUP');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'PRODUCT_SECTION';

-- AlterTable
ALTER TABLE "pizza_flavors" ADD COLUMN     "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "pizza_flavors" ADD CONSTRAINT "pizza_flavors_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
