import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPublishedArticles } from "@/server/content";

export default async function JournalPage() {
  const [t, format, articles] = await Promise.all([
    getTranslations("shop"),
    getFormatter(),
    listPublishedArticles(),
  ]);
  if (articles.length === 0) notFound();
  return (
    <div className="mx-auto max-w-[1000px] px-6 pt-12 pb-[88px]">
      <span className="hk-eyebrow">{t("journal")}</span>
      <h1 className="mt-2.5 mb-10 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[44px]">
        {t("journalTitle")}
      </h1>
      <ul className="border-t border-[var(--border-subtle)]">
        {articles.map((a) => (
          <li key={a.slug} className="border-b border-[var(--border-subtle)] py-7">
            <span className="font-ui text-[11px] tracking-[0.2em] text-[var(--accent)] uppercase">
              {a.publishedAt && format.dateTime(a.publishedAt, "short")}
            </span>
            <h2 className="mt-2.5 mb-2 font-display text-[26px] font-medium tracking-[0.03em] text-[var(--text-display)]">
              <Link href={`/dnevnik/${a.slug}`}>{a.title}</Link>
            </h2>
            {a.excerpt && (
              <p className="max-w-[60ch] font-body text-[17px] leading-relaxed text-[var(--text-secondary)]">
                {a.excerpt}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
