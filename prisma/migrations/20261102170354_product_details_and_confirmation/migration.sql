-- AlterTable
ALTER TABLE "product" ADD COLUMN     "colour_code" TEXT,
ADD COLUMN     "colour_name" TEXT,
ADD COLUMN     "colour_name_maker" TEXT,
ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "confirmed_by" TEXT,
ADD COLUMN     "finish" TEXT,
ADD COLUMN     "manufacturer_line" TEXT,
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "specs" JSONB;

-- CreateIndex
CREATE INDEX "product_confirmed_idx" ON "product"("confirmed");
