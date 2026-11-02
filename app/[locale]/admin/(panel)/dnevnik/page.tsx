import { getFormatter, getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/atoms/MediaImage";
import { PageTitle } from "@/components/atoms/PageTitle";
import { listArticlesAdmin } from "@/features/content/content";
import { Link } from "@/i18n/navigation";

const PILL = "inline-block rounded-[2px] border px-2 py-0.5 text-xs whitespace-nowrap";

export default async function JournalAdminPage() {
  const [t, format, articles] = await Promise.all([
    getTranslations("content"),
    getFormatter(),
    listArticlesAdmin(),
  ]);
  const now = new Date();
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <PageTitle intro={t("journalIntro")}>{t("journal")}</PageTitle>
        <Link
          href="/admin/dnevnik/novi"
          className="inline-flex items-center rounded-[2px] bg-[var(--accent)] px-3 py-2 font-ui text-sm font-semibold whitespace-nowrap text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-bright)]"
        >
          {t("newArticle")}
        </Link>
      </div>
      {articles.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t("noArticles")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="text-xs text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border-strong)]">
                <th className="py-2 pr-3 font-normal">{t("listTitle")}</th>
                <th className="py-2 pr-3 font-normal">{t("listTags")}</th>
                <th className="py-2 pr-3 font-normal">{t("listStatus")}</th>
                <th className="py-2 pr-3 font-normal">{t("listDate")}</th>
                <th className="py-2 font-normal">{t("listUpdated")}</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const scheduled = a.publishedAt !== null && a.publishedAt > now;
                return (
                  <tr key={a.id} className="border-b border-[var(--border-subtle)] text-sm">
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-3">
                        {a.coverKey && a.coverWidth ? (
                          <MediaImage
                            storageKey={a.coverKey}
                            width={a.coverWidth}
                            height={a.coverHeight}
                            alt=""
                            sizes="64px"
                            className="h-10 w-16 flex-none object-cover"
                          />
                        ) : (
                          <span className="h-10 w-16 flex-none bg-[var(--surface-card)]" />
                        )}
                        <Link
                          href={`/admin/dnevnik/${a.id}`}
                          className="text-[var(--accent-bright)] underline underline-offset-2"
                        >
                          {a.title}
                        </Link>
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{a.tags.join(", ")}</td>
                    <td className="py-2.5 pr-3">
                      {a.publishedAt === null ? (
                        <span className={`${PILL} border-[var(--border-strong)] text-[var(--text-muted)]`}>
                          {t("statusDraft")}
                        </span>
                      ) : scheduled ? (
                        <span
                          className={`${PILL} border-[var(--border-strong)] text-[var(--text-secondary)]`}
                        >
                          {t("statusScheduled")}
                        </span>
                      ) : (
                        <span className={`${PILL} border-[var(--accent)] text-[var(--accent-bright)]`}>
                          {t("statusPublished")}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-[var(--text-secondary)]">
                      {a.publishedAt ? format.dateTime(a.publishedAt, "short") : ""}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-[var(--text-muted)]">
                      {format.dateTime(a.updatedAt, "short")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
