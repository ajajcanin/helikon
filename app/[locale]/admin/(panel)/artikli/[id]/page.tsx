import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductControls } from "@/features/catalog/components/ProductControls";
import { ProductEditCard, ReviewPhoto } from "@/features/catalog/components/ProductReview";
import { getReviewRow, reviewOptions } from "@/features/catalog/review";
import { Link } from "@/i18n/navigation";
import { db } from "@/server/db";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [row, options, product, c, t] = await Promise.all([
    getReviewRow(id),
    reviewOptions(),
    db.product.findUnique({ where: { id }, select: { status: true } }),
    getTranslations("common"),
    getTranslations("photos"),
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
      <section className="mb-4 border border-[var(--border-subtle)] p-4">
        <h2 className="mb-1 font-display text-base tracking-[0.04em]">{t("title")}</h2>
        <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">
          {t("hint")}
          {row.variants.filter((v) => v.size).length > 1 && ` ${t("sizeHint")}`}
        </p>
        <ReviewPhoto row={row} />
      </section>
      <ProductControls id={id} status={product.status} variants={row.variants} />
      <ul>
        <ProductEditCard row={row} options={options} />
      </ul>
    </>
  );
}
