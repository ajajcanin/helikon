import { notFound } from "next/navigation";
import { CatalogPage } from "@/features/catalog/components/shop/CatalogPage";
import type { SearchParams } from "@/lib/search-params";
import { getPublicCategory } from "@/server/public/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams };

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getPublicCategory((await params).slug);
  if (!category) notFound();
  // In a subcategory, the tabs show its siblings, so moving between them takes one click.
  const parent = category.parent ? await getPublicCategory(category.parent.slug) : null;
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
