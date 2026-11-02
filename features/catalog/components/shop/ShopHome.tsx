import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import interior from "@/public/images/shop-interior.png";
import storefront from "@/public/images/shop-storefront.png";
import { listCategoryTree, listPublishedProducts } from "@/server/public/catalog";
import { ProductCard, ProductGrid } from "./ProductCard";

const PRIMARY =
  "inline-flex h-12 items-center justify-center rounded-[2px] bg-[var(--accent)] px-6 font-ui text-sm font-semibold tracking-[0.08em] text-[var(--text-on-accent)] hover:bg-[var(--accent-bright)]";
const SECONDARY =
  "inline-flex h-12 items-center justify-center rounded-[2px] border border-[var(--border-brass)] px-6 font-ui text-sm tracking-[0.08em] text-[var(--accent-bright)] hover:border-[var(--accent)]";

export async function ShopHome() {
  const t = await getTranslations("shop");
  const [tree, featured] = await Promise.all([
    listCategoryTree(),
    listPublishedProducts({ categorySlug: "metalik-boje", inStock: true, take: 4 }),
  ]);
  const first = tree[0];
  const count = (c: (typeof tree)[number]) =>
    c._count.products + c.children.reduce((sum, child) => sum + child._count.products, 0);
  const heading =
    "font-display text-[28px] font-medium tracking-[0.05em] text-[var(--text-display)] md:text-[34px]";
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[image:var(--glow-edge)]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-6 md:min-h-[520px] md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 py-14 md:py-20">
            <span className="hk-eyebrow">{t("heroEyebrow")}</span>
            <h1 className="mt-5 font-display text-[46px] leading-[1.05] font-semibold tracking-[0.06em] text-[var(--text-display)] uppercase md:text-[62px]">
              {t("heroFirst")}
              <br />
              {t("heroSecond")}
            </h1>
            <p className="mt-5 max-w-[44ch] font-body text-[19px] leading-relaxed text-[var(--text-secondary)]">
              {t("heroText")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {first && (
                <Link href={`/kategorija/${first.slug}`} className={PRIMARY}>
                  {t("heroCta")}
                </Link>
              )}
              <Link href="/kontakt" className={SECONDARY}>
                {t("heroVisit")}
              </Link>
            </div>
          </div>
          <div className="relative min-h-[260px] self-stretch max-md:-mx-6">
            <Image
              src={storefront}
              alt={t("heroAlt")}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-page)] to-transparent to-35% max-md:hidden" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pt-16 pb-2">
        <span className="hk-eyebrow">{t("shelvesEyebrow")}</span>
        <h2 className={`${heading} mt-2.5 mb-1.5`}>{t("shelvesTitle")}</h2>
        <p className="mb-7 max-w-[56ch] font-body text-[17px] text-[var(--text-secondary)]">
          {t("shelvesText")}
        </p>
        <div className="grid grid-cols-2 border-t border-l border-[var(--border-subtle)] lg:grid-cols-4">
          {tree.map((c) => (
            <Link
              key={c.slug}
              href={`/kategorija/${c.slug}`}
              className="flex min-h-[130px] flex-col gap-2 border-r border-b border-[var(--border-subtle)] p-5 transition-colors hover:bg-[var(--surface-sunk)]"
            >
              <span className="font-ui text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                {t("shelfCount", { count: count(c) })}
              </span>
              <span className="font-display text-lg tracking-[0.08em] text-[var(--text-display)] uppercase md:text-xl">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 pt-16 pb-2">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="hk-eyebrow">{t("featuredEyebrow")}</span>
              <h2 className={`${heading} mt-2.5`}>{t("featuredTitle")}</h2>
            </div>
            {first && (
              <Link
                href={`/kategorija/${first.slug}`}
                className="font-ui text-xs tracking-[0.2em] text-[var(--accent-bright)] uppercase"
              >
                {t("allPaints")}
              </Link>
            )}
          </div>
          <ProductGrid columns={4}>
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        </section>
      )}

      <section className="mx-auto mt-16 max-w-[1200px] px-6 pb-[72px]">
        <div className="grid border border-[var(--border-subtle)] bg-[var(--surface-card)] md:grid-cols-2">
          <div className="p-8 md:p-11">
            <span className="hk-eyebrow">{t("visitEyebrow")}</span>
            <h2 className="mt-3 mb-2.5 font-display text-[28px] font-medium tracking-[0.04em] text-[var(--text-display)]">
              {t("visitTitle")}
            </h2>
            <p className="mb-6 font-body text-[17px] leading-relaxed text-[var(--text-secondary)]">
              {t("visitText")}
            </p>
            <Link href="/kontakt" className={SECONDARY}>
              {t("visitCta")}
            </Link>
          </div>
          <div className="relative min-h-[280px]">
            <Image
              src={interior}
              alt={t("interiorAlt")}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
