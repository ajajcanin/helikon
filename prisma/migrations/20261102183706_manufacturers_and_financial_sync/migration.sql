-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "StockReason" ADD VALUE 'SYNC';

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_brand_id_fkey";

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "exported_at" TIMESTAMP(3),
ADD COLUMN     "external_id" TEXT;

-- AlterTable
ALTER TABLE "product" DROP COLUMN "brand_id",
DROP COLUMN "manufacturer_line",
ADD COLUMN     "line_id" INTEGER,
ADD COLUMN     "manufacturer_id" INTEGER;

-- AlterTable
ALTER TABLE "product_variant" ADD COLUMN     "external_id" TEXT;

-- DropTable
DROP TABLE "brand";

-- CreateTable
CREATE TABLE "manufacturer" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_line" (
    "id" SERIAL NOT NULL,
    "manufacturer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "manufacturer_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_run" (
    "id" SERIAL NOT NULL,
    "system" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_sale" (
    "id" SERIAL NOT NULL,
    "system" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "sold_at" TIMESTAMP(3) NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "qty" INTEGER NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,4),
    "sync_run_id" INTEGER,

    CONSTRAINT "external_sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_slug_key" ON "manufacturer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_name_key" ON "manufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_line_manufacturer_id_name_key" ON "manufacturer_line"("manufacturer_id", "name");

-- CreateIndex
CREATE INDEX "sync_run_system_started_at_idx" ON "sync_run"("system", "started_at");

-- CreateIndex
CREATE INDEX "external_sale_sold_at_idx" ON "external_sale"("sold_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_sale_system_external_id_key" ON "external_sale"("system", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_external_id_key" ON "product_variant"("external_id");

-- AddForeignKey
ALTER TABLE "manufacturer_line" ADD CONSTRAINT "manufacturer_line_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "manufacturer_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_sale" ADD CONSTRAINT "external_sale_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "sync_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

