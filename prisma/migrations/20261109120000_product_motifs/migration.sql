-- CreateEnum
CREATE TYPE "VariantKind" AS ENUM ('SIZE', 'MOTIF');

-- AlterEnum
ALTER TYPE "StockReason" ADD VALUE 'STORE_SALE';

-- DropIndex
DROP INDEX "product_variant_external_id_key";

-- AlterTable
ALTER TABLE "product" ADD COLUMN "variant_kind" "VariantKind" NOT NULL DEFAULT 'SIZE';

-- CreateIndex
CREATE INDEX "product_variant_external_id_idx" ON "product_variant"("external_id");
