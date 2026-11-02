import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { activeQuery, pageParam, param, type SearchParams } from "@/lib/search-params";
import {
  countPublishedProducts,
  familiesIn,
  listPublishedProducts,
  mediumsIn,
} from "@/server/public/catalog";
import { CatalogFilters } from "./CatalogFilters";
import { ProductCard, ProductGrid } from "./ProductCard";

const PAGE_SIZE = 24;
const SORTS = { cijena: "priceAsc", "cijena-opadajuce": "priceDesc" } as const;

type Category = {
  slug: string;
  name: string;
  parent: { slug: string; name: string } | null;
  children: { slug: string; name: string }[];
  /** Subcategory tabs to show: its own, or its siblings when already in one */
  tabs: { slug: string; name: string }[];
  tabsRoot: { slug: string; name: string };
};

export async function CatalogPage({
  category,
  searchParams,
}: {
  category: Category;
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const t = await getTranslations("shop");
  const family = param(sp.boja);
  const medium = param(sp.medij);
  const inStock = param(sp.zaliha) === "da";
  const sortKey = param(sp.red);
  const page = pageParam(sp.strana);
  const pathname = `/kategorija/${category.slug}`;
  const filters = {
    categorySlug: category.slug,
    family: family || undefined,
    medium: medium || undefined,
    inStock,
    sort: SORTS[sortKey as keyof typeof SORTS] ?? ("name" as const),
  };
  const [products, total, families, mediums] = await Promise.all([
    listPublishedProducts({ ...filters, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    countPublishedProducts(filters),
    familiesIn(category.slug),
    mediumsIn(category.slug),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = activeQuery({ boja: family, medij: medium, zaliha: inStock ? "da" : "", red: sortKey });
  const tab =
    "border border-[var(--border-subtle)] rounded-[2px] px-3.5 py-2 font-ui text-xs uppercase tracking-[0.14em]";
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-10 pb-[88px]">
      <nav aria-label={t("nav")} className="mb-4 font-ui text-xs tracking-[0.08em] text-[var(--text-muted)]">
        <Link href="/">{t("home")}</Link>
        {category.parent && (
          <>
            <span className="mx-2">·</span>
            <Link href={`/kategorija/${category.parent.slug}`}>{category.parent.name}</Link>
          </>
        )}
        <span className="mx-2">·</span>
        <span className="text-[var(--text-secondary)]">{category.name}</span>
      </nav>
      <span className="hk-eyebrow">{t("catalog")}</span>
      <h1 className="mt-2.5 mb-5 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[42px]">
        {category.name}
      </h1>
      {category.tabs.length > 0 && (
        <div className="mb-7 flex flex-wrap gap-2">
          <Link
            href={`/kategorija/${category.tabsRoot.slug}`}
            aria-current={category.slug === category.tabsRoot.slug ? "page" : undefined}
            className={`${tab} ${category.slug === category.tabsRoot.slug ? "border-[var(--accent)] text-[var(--accent-bright)]" : "text-[var(--text-secondary)]"}`}
          >
            {t("all")}
          </Link>
          {category.tabs.map((c) => (
            <Link
              key={c.slug}
              href={`/kategorija/${c.slug}`}
              aria-current={c.slug === category.slug ? "page" : undefined}
              className={`${tab} ${c.slug === category.slug ? "border-[var(--accent)] text-[var(--accent-bright)]" : "text-[var(--text-secondary)]"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
      <div className="grid items-start gap-10 lg:grid-cols-[248px_1fr]">
        <aside className="lg:sticky lg:top-32">
          {/* Collapsed on phones, so the products come first. */}
          <details className="border border-[var(--border-subtle)] px-4 py-3 lg:hidden">
            <summary className="cursor-pointer font-ui text-xs tracking-[0.16em] text-[var(--accent-bright)] uppercase">
              {t("showFilters")}
            </summary>
            <div className="mt-4">
              <CatalogFilters
                pathname={pathname}
                families={families}
                mediums={mediums}
                selected={{ family, medium, inStock, sort: sortKey }}
              />
            </div>
          </details>
          <div className="hidden lg:block">
            <CatalogFilters
              pathname={pathname}
              families={families}
              mediums={mediums}
              selected={{ family, medium, inStock, sort: sortKey }}
            />
          </div>
        </aside>
        <div>
          <p className="mb-5 font-ui text-[13px] tracking-[0.08em] text-[var(--text-muted)]">
            {t("results", { count: total })}
          </p>
          {products.length > 0 ? (
            <ProductGrid>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ProductGrid>
          ) : (
            <div className="border border-[var(--border-subtle)] bg-[var(--surface-sunk)] px-6 py-16 text-center">
              <p className="mb-2 font-display text-[22px] tracking-[0.04em]">{t("noResultsTitle")}</p>
              <p className="mb-4 font-body text-[var(--text-secondary)]">{t("noResultsText")}</p>
              <Link
                href={pathname}
                className="font-ui text-sm text-[var(--accent-bright)] underline underline-offset-4"
              >
                {t("clear")}
              </Link>
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-between font-ui text-sm">
              {page > 1 ? (
                <Link href={{ pathname, query: { ...query, strana: page - 1 } }}>{t("previous")}</Link>
              ) : (
                <span />
              )}
              <span className="text-[var(--text-muted)]">{t("page", { page, pages })}</span>
              {page < pages ? (
                <Link href={{ pathname, query: { ...query, strana: page + 1 } }}>{t("next")}</Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
