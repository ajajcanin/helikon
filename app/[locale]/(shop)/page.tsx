import { ShopHome } from "@/features/catalog/components/shop/ShopHome";

/** Cached. A save refreshes what it changed; the hour catches what no save announces, like a scheduled article. */
export const revalidate = 3600;

export default function Home() {
  return <ShopHome />;
}
