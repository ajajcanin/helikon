import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/atoms/MediaImage";
import { ProductCard, ProductGrid } from "@/features/catalog/components/shop/ProductCard";
import {
  type ArticleNode,
  docProductIds,
  readingMinutes,
  sanitizeDoc,
} from "@/features/content/article-content";
import { ArticleBody } from "@/features/content/components/ArticleBody";
import { Link } from "@/i18n/navigation";
import { hasMediaStorage, mediaUrl } from "@/lib/media";
import { cachedArticle, cachedArticleProducts } from "@/server/public/cached";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await cachedArticle((await params).slug);
  if (!article) return {};
  const image =
    hasMediaStorage() && article.coverKey && article.coverWidth
      ? mediaUrl(article.coverKey, article.coverWidth, 1024)
      : undefined;
  return {
    title: `${article.title} · Helikon`,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await cachedArticle(slug);
  if (!article) notFound();
  const [t, format] = await Promise.all([getTranslations("shop"), getFormatter()]);
  // Checked again on the way out, in case something other than the form ever wrote this row.
  const doc: ArticleNode = sanitizeDoc(article.content);
  const inText = docProductIds(doc);
  const ids = [...new Set([...inText, ...article.productIds])];
  const products = await cachedArticleProducts(ids);
  return (
    <article className="pt-10 pb-[88px]">
      <div className="mx-auto max-w-[720px] px-6">
        <Link href="/dnevnik" className="font-ui text-xs tracking-[0.08em] text-[var(--text-muted)]">
          ← {t("journalBack")}
        </Link>
        <p className="mt-5 font-ui text-[11px] tracking-[0.2em] text-[var(--accent)] uppercase">
          {[
            article.tags[0],
            article.publishedAt && format.dateTime(article.publishedAt, "short"),
            t("readTime", { minutes: readingMinutes(article.body) }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h1 className="mt-3 font-display text-[32px] leading-[1.1] font-semibold tracking-[0.04em] text-[var(--text-display)] md:text-[42px]">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-4 font-body text-xl leading-relaxed text-[var(--text-secondary)]">
            {article.excerpt}
          </p>
        )}
        {article.coverKey && article.coverWidth && (
          <MediaImage
            storageKey={article.coverKey}
            width={article.coverWidth}
            height={article.coverHeight}
            alt={article.coverAlt ?? ""}
            sizes="(max-width: 768px) 100vw, 720px"
            priority
            className="mt-7 h-auto w-full"
          />
        )}
        <div className="mt-8">
          <ArticleBody
            doc={doc}
            products={products}
            labels={{
              from: (price) => t("from", { price }),
              outOfStock: t("outOfStock"),
              view: t("viewProduct"),
            }}
          />
        </div>
      </div>
      {products.length > 0 && (
        <section className="mx-auto mt-14 max-w-[1200px] px-6">
          <h2 className="mb-5 font-display text-[26px] font-medium tracking-[0.05em] text-[var(--text-display)]">
            {t("inArticle")}
          </h2>
          <ProductGrid columns={4}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        </section>
      )}
    </article>
  );
}
