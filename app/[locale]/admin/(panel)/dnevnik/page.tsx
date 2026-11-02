import { getFormatter, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { ArticleForm } from "@/features/content/components/ArticleForm";
import { listArticlesAdmin } from "@/features/content/content";
import { Link } from "@/i18n/navigation";

export default async function JournalAdminPage() {
  const [t, format, articles] = await Promise.all([
    getTranslations("content"),
    getFormatter(),
    listArticlesAdmin(),
  ]);
  return (
    <>
      <PageTitle intro={t("journalIntro")}>{t("journal")}</PageTitle>
      {articles.length > 0 && (
        <ul className="mb-8 divide-y divide-[var(--border-subtle)]">
          {articles.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
              <Link
                href={`/admin/dnevnik/${a.id}`}
                className="text-[var(--accent-bright)] underline underline-offset-2"
              >
                {a.title}
              </Link>
              <span className="text-xs text-[var(--text-muted)]">
                {a.publishedAt ? t("visible") : t("hidden")} · {format.dateTime(a.updatedAt, "long")}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mb-3 font-display text-base tracking-[0.04em]">{t("newArticle")}</h2>
      <ArticleForm />
    </>
  );
}
