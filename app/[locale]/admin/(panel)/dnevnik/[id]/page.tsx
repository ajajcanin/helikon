import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArticleForm } from "@/features/content/components/ArticleForm";
import { getArticleAdmin } from "@/features/content/content";
import { Link } from "@/i18n/navigation";

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [article, c] = await Promise.all([getArticleAdmin(id), getTranslations("common")]);
  if (!article) notFound();
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
        body={article.body}
        published={article.publishedAt !== null}
      />
    </>
  );
}
