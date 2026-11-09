import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductControls } from "@/features/catalog/components/ProductControls";
import { ProductEditCard, ReviewPhoto } from "@/features/catalog/components/ProductReview";
import { soldCounts } from "@/features/catalog/products";
import { getReviewRow, reviewOptions } from "@/features/catalog/review";
import { Link } from "@/i18n/navigation";
import { db } from "@/server/db";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [found, options, product, c, t, sold] = await Promise.all([
    getReviewRow(id),
    reviewOptions(),
    db.product.findUnique({ where: { id }, select: { status: true } }),
    getTranslations("common"),
    getTranslations("photos"),
    soldCounts(id),
  ]);
  if (!found || !product) notFound();
  const motifs = found.variantKind === "MOTIF";
  // A series split into motifs keeps its old šifra, inactive, for its history; staff work with the motifs.
  const row = motifs ? { ...found, variants: found.variants.filter((v) => v.active) } : found;
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
          {motifs
            ? ` ${t("motifHint")}`
            : row.variants.filter((v) => v.size).length > 1 && ` ${t("sizeHint")}`}
        </p>
        <ReviewPhoto row={row} />
      </section>
      <ProductControls id={id} status={product.status} variants={row.variants} motifs={motifs} sold={sold} />
      <ul>
        <ProductEditCard row={row} options={options} />
      </ul>
    </>
  );
}
