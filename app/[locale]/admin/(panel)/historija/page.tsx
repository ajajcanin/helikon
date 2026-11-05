import { getFormatter, getTranslations } from "next-intl/server";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { PageTitle } from "@/components/atoms/PageTitle";
import { FilterForm } from "@/components/molecules/FilterForm";
import { Pagination } from "@/components/molecules/Pagination";
import { HISTORY_TABLES, listHistory } from "@/features/admin/history";
import { Link } from "@/i18n/navigation";
import { activeQuery, pageParam, param, type SearchParams } from "@/lib/search-params";

export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const t = await getTranslations("history");
  const c = await getTranslations("common");
  const format = await getFormatter();
  const podrucje = param(sp.podrucje);
  const page = pageParam(sp.strana);
  const data = await listHistory({ table: podrucje || undefined, page });
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <FilterForm className="mb-6 flex items-end gap-3">
        <label className="block w-56 font-ui text-xs text-[var(--text-secondary)]">
          {t("table")}
          <select name="podrucje" defaultValue={podrucje} className={`${FIELD_CLASS} mt-1`}>
            <option value="">{t("allTables")}</option>
            {HISTORY_TABLES.map((table) => (
              <option key={table} value={table}>
                {t(`t_${table}`)}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      {data.rows.length === 0 ? (
        <p className="text-[var(--text-muted)]">{c("empty")}</p>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {data.rows.map((r) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
              <div className="min-w-0">
                <p>
                  {r.title}
                  {r.product && (
                    <>
                      {": "}
                      <Link
                        href={`/admin/artikli/${r.product.id}`}
                        className="text-[var(--accent-bright)] underline underline-offset-2"
                      >
                        {r.product.name}
                      </Link>
                    </>
                  )}
                </p>
                {r.product && r.product.skus.length > 0 && (
                  <p className="mt-1 font-ui text-xs text-[var(--text-muted)]">
                    {t("sku")}: {r.product.skus.join(", ")}
                  </p>
                )}
                {r.changes.map((change) => (
                  <p key={change.field} className="mt-1 font-ui text-xs text-[var(--text-secondary)]">
                    {t(`f_${change.field}`)}: {change.from ?? c("noValue")} → {change.to ?? c("noValue")}
                  </p>
                ))}
              </div>
              <span className="text-[var(--text-muted)]">
                {r.userName} · {format.dateTime(r.at, "long")}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        pathname="/admin/historija"
        page={page}
        pages={data.pages}
        query={activeQuery({ podrucje })}
      />
    </>
  );
}
