-- AlterTable
ALTER TABLE "article" ADD COLUMN     "content" JSONB,
ADD COLUMN     "cover_alt" TEXT,
ADD COLUMN     "cover_height" INTEGER,
ADD COLUMN     "cover_width" INTEGER,
ADD COLUMN     "product_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

