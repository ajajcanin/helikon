import { getTranslations } from "next-intl/server";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { PageTitle } from "@/components/atoms/PageTitle";
import { FilterForm } from "@/components/molecules/FilterForm";
import { Pagination } from "@/components/molecules/Pagination";
import { CategoryFilter } from "@/features/catalog/components/CategoryFilter";
import { listProducts } from "@/features/catalog/products";
import { reviewOptions } from "@/features/catalog/review";
import type { ProductStatus } from "@/generated/prisma/enums";
import { Link } from "@/i18n/navigation";
import { km } from "@/lib/money";
import { activeQuery, pageParam, param, type SearchParams } from "@/lib/search-params";

const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const t = await getTranslations("products");
  const c = await getTranslations("common");
  const q = param(sp.q);
  const kategorija = param(sp.kategorija);
  const podkategorija = param(sp.podkategorija);
  const status = param(sp.status);
  const zaliha = param(sp.zaliha);
  const page = pageParam(sp.strana);
  const [data, options] = await Promise.all([
    listProducts({
      q,
      categoryId: Number(podkategorija) || Number(kategorija) || undefined,
      status: STATUSES.includes(status as ProductStatus) ? (status as ProductStatus) : undefined,
      stock: zaliha === "out" || zaliha === "low" ? zaliha : undefined,
      page,
    }),
    reviewOptions(),
  ]);
  const label = "block font-ui text-xs text-[var(--text-secondary)]";

  return (
    <>
      <PageTitle intro={t("count", { count: data.total })}>{t("title")}</PageTitle>
      <FilterForm className="mb-6 grid items-end gap-3 md:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr]">
        <label className={label}>
          {c("search")}
          <input name="q" defaultValue={q} placeholder={t("searchHint")} className={`${FIELD_CLASS} mt-1`} />
        </label>
        <CategoryFilter tree={options.categoryTree} category={kategorija} subcategory={podkategorija} />
        <label className={label}>
          {t("status")}
          <select name="status" defaultValue={status} className={`${FIELD_CLASS} mt-1`}>
            <option value="">{c("all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t("stock")}
          <select name="zaliha" defaultValue={zaliha} className={`${FIELD_CLASS} mt-1`}>
            <option value="">{t("stockAll")}</option>
            <option value="out">{t("stockOut")}</option>
            <option value="low">{t("stockLow")}</option>
          </select>
        </label>
      </FilterForm>
      {data.rows.length === 0 ? (
        <p className="text-[var(--text-muted)]">{c("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="text-xs text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border-strong)]">
                <th className="py-2 pr-3 font-normal">{c("name")}</th>
                <th className="py-2 pr-3 font-normal">{t("category")}</th>
                <th className="py-2 pr-3 font-normal">{t("variants")}</th>
                <th className="py-2 pr-3 text-right font-normal">{t("price")}</th>
                <th className="py-2 pr-3 text-right font-normal">{t("stock")}</th>
                <th className="py-2 font-normal">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/admin/artikli/${r.id}`}
                      className="text-[var(--accent-bright)] underline underline-offset-2"
                    >
                      {r.name}
                    </Link>
                    {r.sizes && <span className="block text-xs text-[var(--text-muted)]">{r.sizes}</span>}
                  </td>
                  <td className="py-2 pr-3 text-[var(--text-secondary)]">{r.category}</td>
                  <td className="py-2 pr-3 text-[var(--text-secondary)]">{r.skus}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    {r.priceFrom !== null && km(r.priceFrom)}
                    {r.priceTo !== null && r.priceTo !== r.priceFrom && ` – ${km(r.priceTo)}`}
                  </td>
                  <td className={`py-2 pr-3 text-right ${r.stock === 0 ? "text-[var(--error)]" : ""}`}>
                    {r.stock}
                  </td>
                  <td className="py-2 text-[var(--text-secondary)]">{t(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        pathname="/admin/artikli"
        page={page}
        pages={data.pages}
        query={activeQuery({ q, kategorija, podkategorija, status, zaliha })}
      />
    </>
  );
}
