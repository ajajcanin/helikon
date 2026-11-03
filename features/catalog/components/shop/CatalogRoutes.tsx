import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { SearchParams } from "@/lib/search-params";
import { cachedCategory, cachedCategoryTree } from "@/server/public/cached";
import { CatalogPage } from "./CatalogPage";

/** Without `searchParams` these are the plain, cached lists. With them, the live, filtered ones. */
export async function AllProductsCatalog({ searchParams }: { searchParams?: SearchParams }) {
  const [t, tree] = await Promise.all([getTranslations("shop"), cachedCategoryTree()]);
  const root = { slug: "", name: t("allProducts") };
  return (
    <CatalogPage
      category={{
        ...root,
        parent: null,
        children: [],
        tabs: tree.map((c) => ({ slug: c.slug, name: c.name })),
        tabsRoot: root,
      }}
      searchParams={searchParams}
    />
  );
}

export async function CategoryCatalog({ slug, searchParams }: { slug: string; searchParams?: SearchParams }) {
  const category = await cachedCategory(slug);
  if (!category) notFound();
  // In a subcategory, the tabs show its siblings, so moving between them takes one click.
  const parent = category.parent ? await cachedCategory(category.parent.slug) : null;
  return (
    <CatalogPage
      category={{
        ...category,
        tabs: parent?.children ?? category.children,
        tabsRoot: parent
          ? { slug: parent.slug, name: parent.name }
          : { slug: category.slug, name: category.name },
      }}
      searchParams={searchParams}
    />
  );
}
