import { getTranslations } from "next-intl/server";
import { CatalogPage } from "@/features/catalog/components/shop/CatalogPage";
import type { SearchParams } from "@/lib/search-params";
import { listCategoryTree } from "@/server/public/catalog";

export default async function AllProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const [t, tree] = await Promise.all([getTranslations("shop"), listCategoryTree()]);
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
