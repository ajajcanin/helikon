import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductControls } from "@/features/catalog/components/ProductControls";
import { MotifUpload, ProductEditCard } from "@/features/catalog/components/ProductReview";
import { ShopLink } from "@/features/catalog/components/ShopLink";
import { VariantTable } from "@/features/catalog/components/VariantTable";
import { soldCounts } from "@/features/catalog/products";
import { getReviewRow, reviewOptions } from "@/features/catalog/review";
import { Link } from "@/i18n/navigation";
import { db } from "@/server/db";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [found, options, product, c, t, sold, v, sizes] = await Promise.all([
    getReviewRow(id),
    reviewOptions(),
    db.product.findUnique({ where: { id }, select: { status: true, slug: true } }),
    getTranslations("common"),
    getTranslations("photos"),
    soldCounts(id),
    getTranslations("variants"),
    db.productVariant.findMany({
      where: { size: { not: null }, product: { variantKind: "SIZE" } },
      distinct: ["size"],
      orderBy: { size: "asc" },
      select: { size: true },
    }),
  ]);
  if (!found || !product) notFound();
  const motifs = found.variantKind === "MOTIF";
  // A series split into motifs keeps its old šifra for its history; staff work with the motifs, which carry the series' šifra.
  const row = motifs ? { ...found, variants: found.variants.filter((variant) => variant.externalId) } : found;
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/artikli" className="text-[var(--accent-bright)] underline underline-offset-2">
          {c("back")}
        </Link>
        <ShopLink slug={product.slug} status={product.status} className="text-sm" />
      </div>
      <ProductControls id={id} status={product.status} />
      {/* One row per šifra, the same for every product: photo, size or motif, price, stock and whether it's in the shop. */}
      <section className="mb-4 border border-[var(--border-subtle)] p-4">
        <h2 className="mb-1 font-display text-base tracking-[0.04em]">
          {v(motifs ? "titleMotifs" : "title", { count: row.variants.length })}
        </h2>
        <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">
          {t("hint")} {motifs ? t("motifHint") : v("hint")}
        </p>
        {motifs && <MotifUpload row={row} />}
        <VariantTable row={row} sold={sold} sizes={sizes.flatMap((s) => (s.size ? [s.size] : []))} />
      </section>
      <ul>
        <ProductEditCard row={row} options={options} />
      </ul>
    </>
  );
}
