import { AllProductsCatalog } from "@/features/catalog/components/shop/CatalogRoutes";

/** The plain list. `proxy.ts` sends an address with filters to the live version under `filtrirano`. */
export const revalidate = 3600;

export default function AllProductsPage() {
  return <AllProductsCatalog />;
}
