import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/atoms/MediaImage";
import { readingMinutes } from "@/features/content/article-content";
import { Link } from "@/i18n/navigation";
import { param, type SearchParams } from "@/lib/search-params";
import { listPublishedArticles, listPublishedTags } from "@/server/content";

export default async function JournalPage({ searchParams }: { searchParams: SearchParams }) {
  const tag = param((await searchParams).oznaka).slice(0, 40);
  const [t, format, articles, tags] = await Promise.all([
    getTranslations("shop"),
    getFormatter(),
    listPublishedArticles(tag || undefined),
    listPublishedTags(),
  ]);
  if (tags.length === 0 && articles.length === 0) notFound();
  const chip = "rounded-[2px] border px-3 py-1.5 font-ui text-xs uppercase tracking-[0.12em]";
  return (
    <div className="mx-auto max-w-[1000px] px-6 pt-12 pb-[88px]">
      <span className="hk-eyebrow">{t("journal")}</span>
      <h1 className="mt-2.5 mb-6 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[44px]">
        {t("journalTitle")}
      </h1>
      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/dnevnik"
            className={`${chip} ${!tag ? "border-[var(--accent)] text-[var(--accent-bright)]" : "border-[var(--border-subtle)] text-[var(--text-secondary)]"}`}
          >
            {t("allTags")}
          </Link>
          {tags.map((name) => (
            <Link
              key={name}
              href={{ pathname: "/dnevnik", query: { oznaka: name } }}
              className={`${chip} ${tag === name ? "border-[var(--accent)] text-[var(--accent-bright)]" : "border-[var(--border-subtle)] text-[var(--text-secondary)]"}`}
            >
              {name}
            </Link>
          ))}
        </div>
      )}
      <ul className="border-t border-[var(--border-subtle)]">
        {articles.map((a) => (
          <li
            key={a.slug}
            className="grid gap-5 border-b border-[var(--border-subtle)] py-7 md:grid-cols-[1fr_240px]"
          >
            <div>
              <span className="font-ui text-[11px] tracking-[0.2em] text-[var(--accent)] uppercase">
                {[a.tags[0], a.publishedAt && format.dateTime(a.publishedAt, "short")]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <h2 className="mt-2.5 mb-2 font-display text-[26px] font-medium tracking-[0.03em] text-[var(--text-display)]">
                <Link href={`/dnevnik/${a.slug}`}>{a.title}</Link>
              </h2>
              {a.excerpt && (
                <p className="max-w-[60ch] font-body text-[17px] leading-relaxed text-[var(--text-secondary)]">
                  {a.excerpt}
                </p>
              )}
              <p className="mt-2 font-ui text-xs text-[var(--text-muted)]">
                {t("readTime", { minutes: readingMinutes(a.body) })}
              </p>
            </div>
            {a.coverKey && a.coverWidth && (
              <Link
                href={`/dnevnik/${a.slug}`}
                tabIndex={-1}
                aria-hidden="true"
                className="max-md:order-first"
              >
                <MediaImage
                  storageKey={a.coverKey}
                  width={a.coverWidth}
                  height={a.coverHeight}
                  alt=""
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="aspect-[4/3] w-full object-cover"
                />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
