import { CategoryCatalog } from "@/features/catalog/components/shop/CatalogRoutes";
import type { SearchParams } from "@/lib/search-params";

type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams };

/** Reads filters from the address, so it runs live. Customers reach it as `/kategorija/x?...`, through `proxy.ts`. */
export const dynamic = "force-dynamic";

export default async function FilteredCategoryPage({ params, searchParams }: Props) {
  return <CategoryCatalog slug={(await params).slug} searchParams={searchParams} />;
}
