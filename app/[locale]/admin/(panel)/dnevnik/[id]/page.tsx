import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArticleForm } from "@/features/content/components/ArticleForm";
import { getArticleAdmin, knownTags, productLabels } from "@/features/content/content";
import { Link } from "@/i18n/navigation";

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [article, c, tags] = await Promise.all([getArticleAdmin(id), getTranslations("common"), knownTags()]);
  if (!article) notFound();
  const endProducts = await productLabels(article.productIds);
  return (
    <>
      <Link
        href="/admin/dnevnik"
        className="mb-4 inline-block text-[var(--accent-bright)] underline underline-offset-2"
      >
        {c("back")}
      </Link>
      <h1 className="mb-5 font-display text-2xl tracking-[0.06em]">{article.title}</h1>
      <ArticleForm
        id={article.id}
        title={article.title}
        excerpt={article.excerpt ?? ""}
        content={article.content}
        tags={article.tags}
        knownTags={tags}
        publishedAt={article.publishedAt?.toISOString() ?? null}
        cover={
          article.coverKey && article.coverWidth && article.coverHeight
            ? {
                storageKey: article.coverKey,
                width: article.coverWidth,
                height: article.coverHeight,
                alt: article.coverAlt ?? "",
              }
            : null
        }
        endProducts={endProducts}
      />
    </>
  );
}
