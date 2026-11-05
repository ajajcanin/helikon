-- AlterTable
ALTER TABLE "product_photo" ADD COLUMN "variant_id" INTEGER;

-- CreateIndex
CREATE INDEX "product_photo_variant_id_idx" ON "product_photo"("variant_id");

-- AddForeignKey
ALTER TABLE "product_photo" ADD CONSTRAINT "product_photo_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
