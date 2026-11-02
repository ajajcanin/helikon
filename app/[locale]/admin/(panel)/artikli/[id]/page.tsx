import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductControls } from "@/features/catalog/components/ProductControls";
import { ReviewCard } from "@/features/catalog/components/ProductReview";
import { getReviewRow, reviewOptions } from "@/features/catalog/review";
import { Link } from "@/i18n/navigation";
import { db } from "@/server/db";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [row, options, product, c] = await Promise.all([
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
      <ProductControls id={id} status={product.status} variants={row.variants} />
      <ul>
        <ReviewCard row={row} options={options} />
      </ul>
    </>
  );
}
