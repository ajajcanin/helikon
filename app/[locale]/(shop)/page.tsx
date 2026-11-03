import { ShopHome } from "@/features/catalog/components/shop/ShopHome";

/** Cached. Saving in the admin or placing an order refreshes it at once; this catches scheduled changes. */
export const revalidate = 600;

export default function Home() {
  return <ShopHome />;
}
