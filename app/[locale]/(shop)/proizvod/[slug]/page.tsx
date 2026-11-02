import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PaintSwatch } from "@/components/atoms/PaintSwatch";
import { ProductCard, ProductGrid } from "@/features/catalog/components/shop/ProductCard";
import { AddToCart } from "@/features/orders/components/AddToCart";
import { Link } from "@/i18n/navigation";
import { displayName, swatchColour } from "@/lib/colour-swatch";
import { km } from "@/lib/money";
import { getPublishedProduct, listRelatedProducts } from "@/server/public/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getPublishedProduct((await params).slug);
  return product
    ? {
        title: `${displayName(product)} · ${product.category?.name ?? "Helikon"} · Helikon`,
        description: product.description ?? undefined,
      }
    : {};
}

export default async function ProductPage({ params }: Props) {
  const product = await getPublishedProduct((await params).slug);
  if (!product) notFound();
  const t = await getTranslations("shop");
  const related = await listRelatedProducts(product.id, product.categoryId);
  const specs = Array.isArray(product.specs) ? (product.specs as { label: string; value: string }[]) : [];
  const rows: [string, string | null | undefined][] = [
    [t("maker"), product.manufacturer?.name],
    [t("line"), product.line?.name],
    [t("shade"), product.colourCode],
    [t("makerColour"), product.colourNameMaker],
    [t("finish"), product.finish],
    // The finish is already above when a line also lists it.
    ...specs
      .filter((s) => !(product.finish && s.label === t("finish")))
      .map((s): [string, string] => [s.label, s.value]),
  ];
  const name = displayName(product);
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-10 pb-[88px]">
      <nav aria-label={t("nav")} className="mb-6 font-ui text-xs tracking-[0.08em] text-[var(--text-muted)]">
        <Link href="/">{t("home")}</Link>
        {product.category && (
          <>
            <span className="mx-2">·</span>
            <Link href={`/kategorija/${product.category.slug}`}>{product.category.name}</Link>
          </>
        )}
        <span className="mx-2">·</span>
        <span className="text-[var(--text-secondary)]">{name}</span>
      </nav>
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-14">
        <div className="md:sticky md:top-32">
          <PaintSwatch
            color={swatchColour(product.colourFamily)}
            className="aspect-square border border-[var(--border-subtle)]"
          />
          {product.colourFamily && (
            <p className="mt-3 font-ui text-[11px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
              {t("swatchNote")}
            </p>
          )}
        </div>
        <div>
          <span className="font-ui text-xs tracking-[0.2em] text-[var(--accent-bright)] uppercase">
            {product.category?.name}
          </span>
          <h1 className="mt-2.5 font-display text-[32px] leading-[1.08] font-semibold tracking-[0.04em] text-[var(--text-display)] md:text-[46px]">
            {name}
          </h1>
          {product.description && (
            <p className="mt-5 font-body text-[19px] leading-relaxed text-[var(--text-secondary)]">
              {product.description}
            </p>
          )}
          <hr className="hk-rule my-7" />
          <AddToCart
            variants={product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              size: v.size,
              stockQty: v.stockQty,
              priceLabel: km(v.price.toNumber()),
            }))}
          />
          {rows.some(([, value]) => value) && (
            <>
              <hr className="hk-rule mt-8 mb-5" />
              <h2 className="mb-1.5 font-display text-xl font-medium tracking-[0.05em] text-[var(--text-display)] uppercase">
                {t("specs")}
              </h2>
              <dl>
                {rows
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-2 gap-2 border-b border-[var(--border-subtle)] py-3"
                    >
                      <dt className="self-center font-ui text-[11px] tracking-[0.16em] text-[var(--text-muted)] uppercase">
                        {label}
                      </dt>
                      <dd className="text-right font-body text-[17px]">{value}</dd>
                    </div>
                  ))}
              </dl>
            </>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-[72px]">
          <h2 className="mb-5 font-display text-[28px] font-medium tracking-[0.05em] text-[var(--text-display)]">
            {t("related")}
          </h2>
          <ProductGrid columns={4}>
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </ProductGrid>
        </section>
      )}
    </div>
  );
}
