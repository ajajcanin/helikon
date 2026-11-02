import { useTranslations } from "next-intl";
import { FilterForm } from "@/components/molecules/FilterForm";
import { CategoryFilter, type CategoryNode } from "./CategoryFilter";

const FIELD =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-well)] px-2.5 py-2 font-ui text-sm text-[var(--text-display)]";

type Props = {
  q: string;
  status: string;
  categoryId: string;
  subcategoryId: string;
  categoryTree: CategoryNode[];
};

export function ReviewFilters({ q, status, categoryId, subcategoryId, categoryTree }: Props) {
  const t = useTranslations("review");
  return (
    <FilterForm className="mb-6 grid items-end gap-3 md:grid-cols-[2fr_1fr_1.5fr_1.5fr]">
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
      <CategoryFilter tree={categoryTree} category={categoryId} subcategory={subcategoryId} />
    </FilterForm>
  );
}
