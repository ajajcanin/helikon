import { useTranslations } from "next-intl";

const FIELD =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-well)] px-2.5 py-2 font-ui text-sm text-[var(--text-display)]";

type Props = {
  q: string;
  status: string;
  categoryId: string;
  categories: { id: number; label: string }[];
};

/** A plain GET form: filters stay in the URL, so a filtered list can be shared or reloaded. */
export function ReviewFilters({ q, status, categoryId, categories }: Props) {
  const t = useTranslations("review");
  return (
    <form method="get" className="mb-6 grid items-end gap-3 md:grid-cols-[2fr_1fr_2fr_auto]">
      <label className="block font-ui text-xs text-[var(--text-secondary)]">
        {t("search")}
        <input name="q" defaultValue={q} placeholder={t("searchHint")} className={`${FIELD} mt-1`} />
      </label>
      <label className="block font-ui text-xs text-[var(--text-secondary)]">
        {t("status")}
        <select name="status" defaultValue={status} className={`${FIELD} mt-1`}>
          <option value="open">{t("statusOpen")}</option>
          <option value="done">{t("statusDone")}</option>
          <option value="all">{t("statusAll")}</option>
        </select>
      </label>
      <label className="block font-ui text-xs text-[var(--text-secondary)]">
        {t("category")}
        <select name="kategorija" defaultValue={categoryId} className={`${FIELD} mt-1`}>
          <option value="">{t("categoryAll")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="h-[38px] rounded-[2px] border border-[var(--accent)] px-4 font-ui text-sm text-[var(--accent-bright)]"
      >
        {t("filter")}
      </button>
    </form>
  );
}
