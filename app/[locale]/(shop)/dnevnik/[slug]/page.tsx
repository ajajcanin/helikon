import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PlainText } from "@/lib/plain-text";
import { getPublishedArticle } from "@/server/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getPublishedArticle((await params).slug);
  return article ? { title: `${article.title} · Helikon`, description: article.excerpt ?? undefined } : {};
}

export default async function ArticlePage({ params }: Props) {
  const article = await getPublishedArticle((await params).slug);
  if (!article) notFound();
  const [t, format] = await Promise.all([getTranslations("shop"), getFormatter()]);
  return (
    <article className="mx-auto max-w-[720px] px-6 pt-10 pb-[88px]">
      <Link href="/dnevnik" className="font-ui text-xs tracking-[0.08em] text-[var(--text-muted)]">
        {t("journal")}
      </Link>
      <h1 className="mt-4 font-display text-[32px] font-semibold tracking-[0.04em] text-[var(--text-display)] md:text-[42px]">
        {article.title}
      </h1>
      {article.publishedAt && (
        <p className="mt-2 mb-8 font-ui text-xs text-[var(--text-muted)]">
          {format.dateTime(article.publishedAt, "short")}
        </p>
      )}
      <PlainText text={article.body} />
    </article>
  );
}
