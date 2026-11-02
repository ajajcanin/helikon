"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FIELD_CLASS } from "@/components/atoms/Field";

export type CategoryNode = { id: number; name: string; children: { id: number; name: string }[] };

/** Category, then a subcategory from that category. Goes inside a FilterForm. */
export function CategoryFilter({
  tree,
  category,
  subcategory,
}: {
  tree: CategoryNode[];
  category: string;
  subcategory: string;
}) {
  const t = useTranslations("products");
  const [selected, setSelected] = useState(category);
  const sub = useRef<HTMLSelectElement>(null);
  const children = tree.find((node) => String(node.id) === selected)?.children ?? [];

  useEffect(() => setSelected(category), [category]);

  const label = "block font-ui text-xs text-[var(--text-secondary)]";
  return (
    <>
      <label className={label}>
        {t("category")}
        <select
          name="kategorija"
          defaultValue={category}
          className={`${FIELD_CLASS} mt-1`}
          onChange={(event) => {
            setSelected(event.target.value);
            // Cleared here, not on the next render: the form reads its fields as this change reaches it.
            if (sub.current) sub.current.value = "";
          }}
        >
          <option value="">{t("allCategories")}</option>
          {tree.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        {t("subcategory")}
        <select
          ref={sub}
          key={selected}
          name="podkategorija"
          defaultValue={selected === category ? subcategory : ""}
          disabled={children.length === 0}
          className={`${FIELD_CLASS} mt-1 disabled:cursor-not-allowed`}
        >
          <option value="">{t("allSubcategories")}</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
