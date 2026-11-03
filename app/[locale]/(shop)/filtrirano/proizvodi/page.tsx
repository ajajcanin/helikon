import { AllProductsCatalog } from "@/features/catalog/components/shop/CatalogRoutes";
import type { SearchParams } from "@/lib/search-params";

/** Reads filters from the address, so it runs live. Customers reach it as `/proizvodi?...`, through `proxy.ts`. */
export const dynamic = "force-dynamic";

export default function FilteredProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return <AllProductsCatalog searchParams={searchParams} />;
}
