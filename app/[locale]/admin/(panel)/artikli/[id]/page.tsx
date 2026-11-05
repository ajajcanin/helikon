import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PhotoManager } from "@/features/catalog/components/PhotoManager";
import { ProductControls } from "@/features/catalog/components/ProductControls";
import { ReviewCard } from "@/features/catalog/components/ProductReview";
import { listPhotos } from "@/features/catalog/photos";
import { getReviewRow, reviewOptions } from "@/features/catalog/review";
import { Link } from "@/i18n/navigation";
import { db } from "@/server/db";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [photos, row, options, product, c] = await Promise.all([
    listPhotos(id),
    getReviewRow(id),
    reviewOptions(),
    db.product.findUnique({ where: { id }, select: { status: true } }),
    getTranslations("common"),
  ]);
  if (!row || !product) notFound();
  return (
    <>
      <Link
        href="/admin/artikli"
        className="mb-4 inline-block text-[var(--accent-bright)] underline underline-offset-2"
      >
        {c("back")}
      </Link>
      <PhotoManager
        productId={id}
        photos={photos}
        sizes={row.variants.flatMap((v) => (v.size ? [{ id: v.id, size: v.size }] : []))}
      />
      <ProductControls id={id} status={product.status} variants={row.variants} />
      <ul>
        <ReviewCard row={row} options={options} />
      </ul>
    </>
  );
}
