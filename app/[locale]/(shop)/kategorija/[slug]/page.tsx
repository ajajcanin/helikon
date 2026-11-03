import { CategoryCatalog } from "@/features/catalog/components/shop/CatalogRoutes";

type Props = { params: Promise<{ slug: string }> };

/** The plain list. `proxy.ts` sends an address with filters to the live version under `filtrirano`. */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export default async function CategoryPage({ params }: Props) {
  return <CategoryCatalog slug={(await params).slug} />;
}
