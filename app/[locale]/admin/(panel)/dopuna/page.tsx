import { getTranslations } from "next-intl/server";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { FilterForm } from "@/components/molecules/FilterForm";
import { ProductEditCard } from "@/features/catalog/components/ProductReview";
import {
  colourCategoryIds,
  listMissing,
  MISSING_TABS,
  type MissingTab,
  missingCounts,
} from "@/features/catalog/missing";
import { reviewOptions } from "@/features/catalog/review";
import { Link } from "@/i18n/navigation";

const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/** Products that lack something, a tab for each thing: fill it in and the product leaves that tab. */
export default async function MissingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("missing");
  const tab = (MISSING_TABS as readonly string[]).includes(single(params.tab))
    ? (single(params.tab) as MissingTab)
    : "opis";
  const q = single(params.q);
  const category = single(params.kategorija);
  const page = Math.max(1, Number(single(params.strana)) || 1);
  const [data, counts, options, coloured] = await Promise.all([
    listMissing({ tab, q, categoryId: Number(category) || undefined, page }),
    missingCounts(),
    reviewOptions(),
    colourCategoryIds(),
  ]);
  const link = (to: { tab?: MissingTab; strana?: number }) => ({
    pathname: "/admin/dopuna",
    query: {
      tab: to.tab ?? tab,
      ...(q && { q }),
      ...(category && { kategorija: category }),
      ...(to.strana && to.strana > 1 && { strana: to.strana }),
    },
  });

  return (
    <>
      <h1 className="font-display text-2xl tracking-[0.08em]">{t("title")}</h1>
      <p className="mt-2 mb-5 font-ui text-sm text-[var(--text-secondary)]">{t("intro")}</p>
      <nav
        aria-label={t("title")}
        className="mb-5 flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3"
      >
        {MISSING_TABS.map((key) => (
          <Link
            key={key}
            href={link({ tab: key })}
            aria-current={key === tab ? "page" : undefined}
            className={`rounded-[2px] border px-3 py-2 font-ui text-sm ${key === tab ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-display)]" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"}`}
          >
            {t(`tabs.${key}`)} <span className="text-[var(--text-muted)]">({counts[key]})</span>
          </Link>
        ))}
      </nav>
      <FilterForm className="mb-5 flex flex-wrap items-end gap-3">
        <input type="hidden" name="tab" value={tab} />
        <label className="block w-64 font-ui text-xs text-[var(--text-secondary)]">
          {t("search")}
          <input name="q" defaultValue={q} className={`${FIELD_CLASS} mt-1`} />
        </label>
        <label className="block w-72 font-ui text-xs text-[var(--text-secondary)]">
          {t("category")}
          <select name="kategorija" defaultValue={category} className={`${FIELD_CLASS} mt-1`}>
            <option value="">{t("allCategories")}</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">{t(`hints.${tab}`)}</p>
      {data.rows.length === 0 ? (
        <p className="font-ui text-sm text-[var(--text-muted)]">{t("empty")}</p>
      ) : (
        // Keyed so changing tab, filter or page starts each card from what is saved.
        <ul key={JSON.stringify(params)} className="flex flex-col gap-4">
          {data.rows.map((row) => (
            <ProductEditCard
              key={row.id}
              row={row}
              options={options}
              colours={Boolean(row.colourName || row.colourFamily) || coloured.includes(row.categoryId ?? -1)}
              openLink
            />
          ))}
        </ul>
      )}
      {data.pages > 1 && (
        <nav className="mt-6 flex items-center justify-between font-ui text-sm">
          {page > 1 ? <Link href={link({ strana: page - 1 })}>{t("previous")}</Link> : <span />}
          <span className="text-[var(--text-muted)]">{t("page", { page, pages: data.pages })}</span>
          {page < data.pages ? <Link href={link({ strana: page + 1 })}>{t("next")}</Link> : <span />}
        </nav>
      )}
    </>
  );
}
