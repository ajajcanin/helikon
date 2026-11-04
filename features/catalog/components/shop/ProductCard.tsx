import { getTranslations } from "next-intl/server";
import { PaintSwatch } from "@/components/atoms/PaintSwatch";
import { ProductImage } from "@/components/atoms/ProductImage";
import { Link } from "@/i18n/navigation";
import { displayName, swatchColour } from "@/lib/colour-swatch";
import { km } from "@/lib/money";
import type { listPublishedProducts } from "@/server/public/catalog";

export type CardProduct = Awaited<ReturnType<typeof listPublishedProducts>>[number];

export async function ProductCard({ product }: { product: CardProduct }) {
  const t = await getTranslations("shop");
  const photo = product.photos[0];
  const prices = product.variants.map((v) => v.price);
  const from = prices.length ? Math.min(...prices) : 0;
  const several = new Set(prices).size > 1;
  const inStock = product.variants.some((v) => v.stockQty > 0);
  const label = km(from);
  return (
    <article className="group relative flex flex-col overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-card)] transition duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-1 hover:border-[var(--border-brass)]">
      {photo ? (
        <ProductImage
          storageKey={photo.storageKey}
          width={photo.width}
          height={photo.height}
          alt={photo.alt ?? displayName(product)}
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="aspect-square w-full"
        />
      ) : (
        <PaintSwatch color={swatchColour(product.colourFamily)} className="aspect-square" />
      )}
      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3 pb-4">
        <span className="font-ui text-[10.5px] tracking-[0.16em] text-[var(--accent-bright)] uppercase">
          {product.category?.name}
          {product.colourCode ? ` · ${product.colourCode}` : ""}
        </span>
        <h3 className="font-display text-lg leading-snug font-medium tracking-[0.03em] text-[var(--text-display)]">
          {/* The whole card is the link. */}
          <Link href={`/proizvod/${product.slug}`} className="after:absolute after:inset-0">
            {displayName(product)}
          </Link>
        </h3>
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1 font-ui text-sm">
          <span className="font-semibold text-[var(--text-display)]">
            {several ? t("from", { price: label }) : label}
          </span>
          {!inStock && <span className="text-xs text-[var(--text-muted)]">{t("outOfStock")}</span>}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ children, columns = 3 }: { children: React.ReactNode; columns?: 3 | 4 }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 md:gap-[18px] ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
    >
      {children}
    </div>
  );
}
