import { useTranslations } from "next-intl";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { FilterForm } from "@/components/molecules/FilterForm";
import { Link } from "@/i18n/navigation";
import { swatchColour } from "@/lib/colour-swatch";
import { COLOUR_FAMILIES } from "../../classify";

type Props = {
  pathname: string;
  families: string[];
  mediums: string[];
  selected: { q: string; family: string; medium: string; inStock: boolean; sort: string };
};

/** Links and a GET form, so filters also work without JavaScript and every filtered page has its own address. */
export function CatalogFilters({ pathname, families, mediums, selected }: Props) {
  const t = useTranslations("shop");
  const heading = "mb-3 font-ui text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase";
  const query = (family: string) => ({
    ...(selected.q ? { q: selected.q } : {}),
    ...(family ? { boja: family } : {}),
    ...(selected.medium ? { medij: selected.medium } : {}),
    ...(selected.inStock ? { zaliha: "da" } : {}),
    ...(selected.sort ? { red: selected.sort } : {}),
  });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="font-ui text-[11px] tracking-[0.24em] text-[var(--accent)] uppercase">
            {t("filters")}
          </span>
          <Link
            href={pathname}
            className="font-ui text-[11px] tracking-[0.1em] text-[var(--text-muted)] uppercase"
          >
            {t("clear")}
          </Link>
        </div>
        <hr className="hk-rule mt-3" />
      </div>
      {families.length > 0 && (
        <div>
          <p className={heading}>{t("family")}</p>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link
                href={{ pathname, query: query("") }}
                aria-current={!selected.family ? "true" : undefined}
                className={`block py-1 font-body text-base ${!selected.family ? "text-[var(--accent-bright)]" : "text-[var(--text-secondary)]"}`}
              >
                {t("allColours")}
              </Link>
            </li>
            {COLOUR_FAMILIES.filter(([id]) => families.includes(id)).map(([id, label]) => (
              <li key={id}>
                <Link
                  href={{ pathname, query: query(id) }}
                  aria-current={selected.family === id ? "true" : undefined}
                  className={`flex items-center gap-2.5 py-1 font-body text-base ${selected.family === id ? "text-[var(--accent-bright)]" : "text-[var(--text-secondary)] hover:text-[var(--text-display)]"}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 flex-none rounded-full border border-[var(--border-strong)]"
                    style={{ background: swatchColour(id) ?? undefined }}
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <FilterForm pathname={pathname} className="flex flex-col gap-4">
        {selected.q && <input type="hidden" name="q" value={selected.q} />}
        {selected.family && <input type="hidden" name="boja" value={selected.family} />}
        {mediums.length > 1 && (
          <label className={heading}>
            {t("medium")}
            <select
              name="medij"
              defaultValue={selected.medium}
              className={`${FIELD_CLASS} mt-2 tracking-normal normal-case`}
            >
              <option value="">{t("all")}</option>
              {mediums.includes("akril") && <option value="akril">{t("mediumAkril")}</option>}
              {mediums.includes("ulje") && <option value="ulje">{t("mediumUlje")}</option>}
            </select>
          </label>
        )}
        <label className={heading}>
          {t("sort")}
          <select
            name="red"
            defaultValue={selected.sort}
            className={`${FIELD_CLASS} mt-2 tracking-normal normal-case`}
          >
            <option value="">{t("sortName")}</option>
            <option value="cijena">{t("sortPriceAsc")}</option>
            <option value="cijena-opadajuce">{t("sortPriceDesc")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2.5 font-body text-base text-[var(--text-secondary)]">
          <input
            type="checkbox"
            name="zaliha"
            value="da"
            defaultChecked={selected.inStock}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {t("inStock")}
        </label>
        <noscript>
          <button
            type="submit"
            className="h-10 w-full rounded-[2px] border border-[var(--border-brass)] font-ui text-sm text-[var(--accent-bright)]"
          >
            {t("apply")}
          </button>
        </noscript>
      </FilterForm>
    </div>
  );
}
