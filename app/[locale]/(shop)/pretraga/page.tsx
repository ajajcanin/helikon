import { getTranslations } from "next-intl/server";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { ProductCard, ProductGrid } from "@/features/catalog/components/shop/ProductCard";
import { param, type SearchParams } from "@/lib/search-params";
import { listPublishedProducts } from "@/server/public/catalog";

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = param((await searchParams).q)
    .trim()
    .slice(0, 100);
  const t = await getTranslations("shop");
  const products = q ? await listPublishedProducts({ q, take: 48 }) : [];
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-[88px]">
      <h1 className="mb-6 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[42px]">
        {t("searchTitle")}
      </h1>
      <form method="get" className="mb-8 max-w-lg">
        <input
          name="q"
          type="search"
          defaultValue={q}
          aria-label={t("search")}
          placeholder={t("searchHint")}
          className={FIELD_CLASS}
        />
      </form>
      {!q && <p className="font-body text-lg text-[var(--text-secondary)]">{t("searchStart")}</p>}
      {q && products.length === 0 && (
        <p className="font-body text-lg text-[var(--text-secondary)]">{t("searchEmpty", { q })}</p>
      )}
      {products.length > 0 && (
        <ProductGrid columns={4}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductGrid>
      )}
    </div>
  );
}
